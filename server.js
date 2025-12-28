// File: server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Use Routes
// Note: We fix the URLs here to match what the frontend expects
app.use('/api', authRoutes);         
app.use('/api/products', productRoutes); 
// For categories, we need a slight adjustment because frontend calls /api/categories
app.use('/api', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api', orderRoutes); // Catches /api/user/cards and admin routes

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});