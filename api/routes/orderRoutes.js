const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes - require authentication
// Get pending orders
router.get('/pending-orders/:id', authenticateToken, orderController.getPendingOrders);

// Get vendor orders with pagination
router.get('/wow/:id', authenticateToken, orderController.getVendorOrders);

// Get customer orders
router.get('/orderdetails/:id', authenticateToken, orderController.getCustomerOrders);

// Public route - Get recent orders for dashboard
router.get('/dashboard/recent', orderController.getRecentOrders);

// Protected routes
// Create cart orders
router.post('/ordercart', authenticateToken, orderController.createCartOrders);

// Cancel order
router.put('/api/cancel/:id', authenticateToken, orderController.cancelOrder);

// Update order status
router.put('/update-order-status/:id', authenticateToken, orderController.updateOrderStatus);

module.exports = router;

