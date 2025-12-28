// File: routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// User Order Routes
router.post('/create', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.put('/:id/cancel', orderController.cancelOrder);
router.get('/cards', orderController.getUserCards);

// Admin Routes
router.get('/admin/all', orderController.getAdminOrders);
router.get('/admin/users', orderController.getAllUsers);
router.delete('/admin/users/:id', orderController.deleteUser);

module.exports = router;