const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { requireVendor, requireAdmin, requireRole } = require('../middleware/Rolebased');
const { cacheMiddleware } = require('../config/redis');

// Public routes
// Get all vendor registrations (temp vendors) - admin only
router.get('/api/vendor', authenticateToken, vendorController.getAllVendorRegistrations);

// Get all approved vendors (cached 5 min) - public for browsing
router.get('/vendor', cacheMiddleware(300), vendorController.getAllVendors);

// Get vendor count - admin dashboard
router.get('/vendor/count', vendorController.getVendorCount);

// Get pending request count - admin dashboard
router.get('/vendor/countofpendingrequest', vendorController.getPendingRequestCount);

// Get vendor details by ID (cached 5 min) - public for viewing profiles
router.get('/api/getdetails/vendor/:id', cacheMiddleware(300), vendorController.getVendorDetails);

// Get professional details (cached 5 min) - public for viewing profiles
router.get('/profesionaldetails/:id', cacheMiddleware(300), vendorController.getProfessionalDetails);

// Get vendor category (cached 10 min)
router.get('/api/categories/:id', cacheMiddleware(600), vendorController.getVendorCategory);

// Get vendor total views (vendor analytics)
router.get('/api/vendor/:vendorId/totalviews', authenticateToken, requireVendor(), vendorController.getVendorTotalViews);

// Get vendor price
router.get('/api/vendor/:vendorId/price', vendorController.getVendorPrice);

// Get vendor analytics
router.get('/vendor/:id/analytics', authenticateToken, requireVendor(), vendorController.getVendorAnalytics);

// Register new vendor (public - for signup)
router.post(
    '/register',
    upload.fields([
        { name: 'productImages', maxCount: 10 },
        { name: 'profileImage', maxCount: 1 },
    ]),
    vendorController.registerVendor
);

// Add vendor (admin only)
router.post('/add_vendor', authenticateToken, requireAdmin(), vendorController.addVendor);

// Approve vendor (admin only)
router.post('/postdatabase/:id', authenticateToken, requireAdmin(), vendorController.approveVendor);

// Check temp vendor
router.post('/checktempvendor', vendorController.checkTempVendor);

// Protected routes - require authentication and vendor role
// Get vendor settings
router.get('/:id/settings', authenticateToken, requireVendor(), vendorController.getVendorSettings);

// Get job history (vendor viewing their job history)
router.get('/jobhistry/:id', authenticateToken, requireVendor(), vendorController.Getjobhistory);

// Update vendor details
router.put(
    '/update/userdetailes/:id',
    authenticateToken,
    requireVendor(),
    upload.fields([
        { name: 'productImages', maxCount: 10 },
        { name: 'profileImage', maxCount: 1 },
    ]),
    vendorController.updateVendorDetails
);

module.exports = router;
