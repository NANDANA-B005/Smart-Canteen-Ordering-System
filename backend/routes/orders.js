const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Middleware to protect routes for staff
const authStaff = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, auth denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Create a new order (from student Cart after UPI confirmation)
router.post('/', async (req, res) => {
  try {
    // Expected body matches Order schema
    const orderData = req.body;

    // Add Stock Validation
    for (const item of orderData.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${item.name}` });
      }
    }

    // Generate unique order ID dynamically
    orderData.orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    orderData.paymentStatus = 'User Confirmed'; // Crucial logic mapping for prototype
    
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Broadcast new order to staff
    req.io.emit('new_order', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order by ID (Used by QR Scanner)
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).populate('items.productId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update item serve status (Staff scanning QR)
router.patch('/:orderId/items/:itemId/serve', authStaff, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const staffCounter = req.user.counter;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Find the specific item in the order array
    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in order' });

    // Ensure staff can only serve their counter's items (or admin)
    if (staffCounter !== 'All-Admin' && item.counter !== staffCounter) {
      return res.status(403).json({ error: `You can only serve items for ${staffCounter}` });
    }

    if (item.serveStatus === 'Completed') {
      return res.status(400).json({ error: 'Item is already served' });
    }

    // Process Stock Reduction
    const product = await Product.findById(item.productId);
    if (product) {
      if (product.quantity < item.quantity) {
          return res.status(400).json({ error: 'Insufficient stock left to serve this item.' });
      }
      product.quantity -= item.quantity;
      if (product.quantity === 0) {
        product.status = 'Sold Out';
      }
      await product.save();
      // Inform clients of real-time stock reduction
      req.io.emit('product_updated', product);
    }

    item.serveStatus = 'Completed';
    await order.save();

    // Broadcast update
    req.io.emit('order_updated', order);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update serve status' });
  }
});

module.exports = router;
