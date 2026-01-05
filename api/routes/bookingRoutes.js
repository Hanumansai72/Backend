const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');
const { requireServiceVendor, requireCustomer, requireVendor, requireRole } = require('../middleware/Rolebased');

// Public routes - Get booking info (can be accessed by related parties)
// Get booking location
router.get('/fetch/location/booking/:id', bookingController.getBookingLocation);

// Get booked dates
router.get('/datedeatils/:id', bookingController.getBookedDates);

// Protected routes - Technical vendors (service providers)
// Get job history (vendors viewing their completed jobs)
router.get('/jobhistry/:id', authenticateToken, requireServiceVendor(), bookingController.getJobHistory);

// Get new jobs (Technical vendors getting new job requests)
router.get('/api/newjob/:id', authenticateToken, requireServiceVendor(), bookingController.getNewJobs);

// Get service count (Technical vendors)
router.get('/count/service/:id', authenticateToken, requireServiceVendor(), bookingController.getServiceCount);

// Get service job by ID (Technical vendors)
router.get('/services/jobs/:id', authenticateToken, requireServiceVendor(), bookingController.getServiceJobById);

// Get cart services (customers viewing their service bookings)
router.get('/cart/service/:id', authenticateToken, requireRole(['customer', 'admin']), bookingController.getCartServices);

// Get upcoming works (Technical vendors)
router.get('/upcomingworks/:id', authenticateToken, requireServiceVendor(), bookingController.getUpcomingWorks);

// Get upcoming jobs (alias for new jobs - Technical vendors)
router.get('/upcomingjobs/:id', authenticateToken, requireServiceVendor(), bookingController.getNewJobs);

// Create booking (customers booking services)
router.post('/api/booking', authenticateToken, requireCustomer(), bookingController.createBooking);

// Update booking status (Technical vendors updating job status)
router.put('/api/bookings/:id/status', authenticateToken, requireServiceVendor(), bookingController.updateBookingStatus);

module.exports = router;
