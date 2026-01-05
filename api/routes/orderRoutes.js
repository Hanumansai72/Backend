const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requireCustomer, requireProductVendor } = require('../middleware/Rolebased');

// Protected routes - require authentication
// Get pending orders (Non-Technical vendors checking pending product orders)
router.get('/pending-orders/:id', authenticateToken, requireProductVendor(), orderController.getPendingOrders);

// Get vendor orders with pagination (Non-Technical vendors)
router.get('/wow/:id', authenticateToken, requireProductVendor(), orderController.getVendorOrders);

// Get customer orders (customers viewing their own orders)
router.get('/orderdetails/:id', authenticateToken, requireCustomer(), orderController.getCustomerOrders);

// Public route - Get recent orders for dashboard
router.get('/dashboard/recent', orderController.getRecentOrders);

// Protected routes
// Create cart orders (customers placing orders)
router.post('/ordercart', authenticateToken, requireCustomer(), orderController.createCartOrders);

// Cancel order (customers can cancel their orders)
router.put('/api/cancel/:id', authenticateToken, requireRole(['customer', 'admin']), orderController.cancelOrder);

// Update order status (Non-Technical vendors updating order status)
router.put('/update-order-status/:id', authenticateToken, requireProductVendor(), orderController.updateOrderStatus);

module.exports = router;
