const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Staff', 'Admin'] },
  counter: { type: String, enum: ['Tea', 'Snacks', 'Meals', 'All-Admin'] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
