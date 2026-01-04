const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

// Public routes
// Get all vendor registrations (temp vendors)
router.get('/api/vendor', vendorController.getAllVendorRegistrations);

// Get all approved vendors
router.get('/vendor', vendorController.getAllVendors);

// Get vendor count
router.get('/vendor/count', vendorController.getVendorCount);

// Get pending request count
router.get('/vendor/countofpendingrequest', vendorController.getPendingRequestCount);

// Get vendor details by ID
router.get('/api/getdetails/vendor/:id', vendorController.getVendorDetails);

// Get professional details
router.get('/profesionaldetails/:id', vendorController.getProfessionalDetails);

// Get vendor category
router.get('/api/categories/:id', vendorController.getVendorCategory);

// Get vendor total views
router.get('/api/vendor/:vendorId/totalviews', vendorController.getVendorTotalViews);

// Get vendor price
router.get('/api/vendor/:vendorId/price', vendorController.getVendorPrice);

// Get vendor analytics
router.get('/vendor/:id/analytics', vendorController.getVendorAnalytics);

// Register new vendor (public - for signup)
router.post(
    '/register',
    upload.fields([
        { name: 'productImages', maxCount: 10 },
        { name: 'profileImage', maxCount: 1 },
    ]),
    vendorController.registerVendor
);

// Add vendor (admin)
router.post('/add_vendor', vendorController.addVendor);

// Approve vendor
router.post('/postdatabase/:id', vendorController.approveVendor);

// Check temp vendor
router.post('/checktempvendor', vendorController.checkTempVendor);

// Protected routes - require authentication
// Get vendor settings
router.get('/:id/settings', authenticateToken, vendorController.getVendorSettings);

// Get job history
router.get('/jobhistry/:id', authenticateToken, vendorController.Getjobhistory);

// Update vendor details
router.put(
    '/update/userdetailes/:id',
    authenticateToken,
    upload.fields([
        { name: 'productImages', maxCount: 10 },
        { name: 'profileImage', maxCount: 1 },
    ]),
    vendorController.updateVendorDetails
);

module.exports = router;

