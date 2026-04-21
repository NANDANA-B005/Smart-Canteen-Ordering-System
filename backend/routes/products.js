const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Get all products (live stock)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ counter: 1, name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Update stock (Staff only)
// Expected body: { quantity: Number, status: String }
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, status } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { quantity, status: quantity > 0 ? (status || 'Available') : 'Sold Out' } },
      { new: true }
    );
    
    // Broadcast change to all connected clients
    req.io.emit('product_updated', product);
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Add new product (Staff only)
router.post('/', async (req, res) => {
  try {
    const { name, price, quantity, counter, imageUrl, tags } = req.body;
    const newProduct = new Product({
      name,
      price,
      quantity,
      counter,
      imageUrl,
      tags: tags || [],
      status: quantity > 0 ? 'Available' : 'Sold Out'
    });
    await newProduct.save();

    // Broadcast new product
    req.io.emit('product_updated', newProduct);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Delete a product (Staff only, strict counter permission)
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });
    
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Validate permission
    if (decoded.counter !== 'All-Admin' && decoded.counter !== product.counter) {
        return res.status(403).json({ error: 'Forbidden: You can only delete items from your own counter' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Broadcast deletion
    req.io.emit('product_deleted', req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
