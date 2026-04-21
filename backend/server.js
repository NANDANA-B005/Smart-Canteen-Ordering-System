const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Init Express & Socket setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});

app.use(cors());
app.use(express.json());

// Pass IO instance to req for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Wait for MongoDB and seed initial mock data
const initDB = async () => {
  const uri = process.env.MONGO_URI;

  await mongoose.connect(uri);
  console.log(`Connected to persistent MongoDB`);

  // Seed Data: Products
  const Product = require('./models/Product');
  const count = await Product.countDocuments();
  if (count === 0) {
    console.log('Seeding products...');
    await Product.insertMany([
      { name: 'Masala Chai', price: 15, quantity: 50, counter: 'Tea', status: 'Available', tags: ['tea', 'hot', 'drink'] },
      { name: 'Filter Coffee', price: 20, quantity: 40, counter: 'Tea', status: 'Available', tags: ['coffee', 'hot', 'drink'] },
      { name: 'Samosa', price: 18, quantity: 100, counter: 'Snacks', status: 'Available', tags: ['snack', 'spicy'] },
      { name: 'Veg Puff', price: 25, quantity: 20, counter: 'Snacks', status: 'Available', tags: ['snack', 'light'] },
      { name: 'Mini Meals (South)', price: 70, quantity: 30, counter: 'Meals', status: 'Available', tags: ['meal', 'filling', 'lunch'] },
      { name: 'Veg Biryani', price: 90, quantity: 25, counter: 'Meals', status: 'Available', tags: ['meal', 'spicy', 'filling', 'lunch'] }
    ]);
  }

  // Seed Data: Staff Users
  const User = require('./models/User');
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Seeding staff users...');
    const defaultPassword = await bcrypt.hash('staff123', 10);
    await User.insertMany([
      { username: 'tea_staff', password: defaultPassword, role: 'Staff', counter: 'Tea' },
      { username: 'snacks_staff', password: defaultPassword, role: 'Staff', counter: 'Snacks' },
      { username: 'meals_staff', password: defaultPassword, role: 'Staff', counter: 'Meals' },
      { username: 'admin', password: await bcrypt.hash('admin123', 10), role: 'Admin', counter: 'All-Admin' }
    ]);
  }
};

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Canteen Server running on http://localhost:${PORT}`);
  });
});