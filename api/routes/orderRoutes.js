const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get pending orders
router.get('/pending-orders/:id', orderController.getPendingOrders);

// Get vendor orders with pagination
router.get('/wow/:id', orderController.getVendorOrders);

// Get customer orders
router.get('/orderdetails/:id', orderController.getCustomerOrders);

// Get recent orders
router.get('/dashboard/recent', orderController.getRecentOrders);

// Create cart orders
router.post('/ordercart', orderController.createCartOrders);

// Cancel order
router.put('/api/cancel/:id', orderController.cancelOrder);

// Update order status
router.put('/update-order-status/:id', orderController.updateOrderStatus);

module.exports = router;
