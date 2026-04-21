const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  counter: { type: String, required: true, enum: ['Tea', 'Snacks', 'Meals'] },
  status: { type: String, required: true, enum: ['Available', 'Sold Out'], default: 'Available' },
  imageUrl: { type: String },
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
