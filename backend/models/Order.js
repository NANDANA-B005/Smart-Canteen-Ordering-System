const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  counter: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  serveStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  studentRoll: { type: String },
  mobile: { type: String },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'User Confirmed'], default: 'Pending' },
  items: [orderItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
