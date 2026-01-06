const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/Rolebased');

// All admin routes require authentication and admin role
const adminAuth = [authenticateToken, requireAdmin()];

// ==================== VENDOR MANAGEMENT ====================

// Get all vendors with filters (status, category, kycStatus, search)
router.get('/admin/vendors', adminAuth, adminController.getAllVendorsAdmin);

// Get pending vendor registrations
router.get('/admin/vendors/pending', adminAuth, adminController.getPendingVendors);

// Get vendor details with performance metrics
router.get('/admin/vendors/:id', adminAuth, adminController.getVendorDetailsAdmin);

// Update vendor status (active/suspended/banned)
router.put('/admin/vendors/:id/status', adminAuth, adminController.updateVendorStatus);

// Update vendor KYC status (pending/verified/rejected)
router.put('/admin/vendors/:id/kyc', adminAuth, adminController.updateVendorKYC);

// Edit vendor details (admin override)
router.put('/admin/vendors/:id', adminAuth, adminController.updateVendorAdmin);

// ==================== CUSTOMER MANAGEMENT ====================

// Get all customers with filters
router.get('/admin/customers', adminAuth, adminController.getAllCustomers);

// Get customer details with order history
router.get('/admin/customers/:id', adminAuth, adminController.getCustomerDetails);

// Update customer status (block/unblock)
router.put('/admin/customers/:id/status', adminAuth, adminController.updateCustomerStatus);

// ==================== ORDER MANAGEMENT ====================

// Get all orders with filters
router.get('/admin/orders', adminAuth, adminController.getAllOrdersAdmin);

// Update order status manually
router.put('/admin/orders/:id', adminAuth, adminController.updateOrderStatusAdmin);

// Cancel order
router.put('/admin/orders/:id/cancel', adminAuth, adminController.cancelOrderAdmin);

// ==================== ANALYTICS ====================

// Get dashboard analytics
router.get('/admin/analytics', adminAuth, adminController.getDashboardAnalytics);

// ==================== REVIEWS & COMPLAINTS ====================

// Get all reviews
router.get('/admin/reviews', adminAuth, adminController.getAllReviews);

// Flag/unflag review
router.put('/admin/reviews/:id', adminAuth, adminController.flagReview);

// Delete review
router.delete('/admin/reviews/:id', adminAuth, adminController.deleteReview);

module.exports = router;
