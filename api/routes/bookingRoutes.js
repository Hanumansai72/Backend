const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Get booking location
router.get('/fetch/location/booking/:id', bookingController.getBookingLocation);

// Get booked dates
router.get('/datedeatils/:id', bookingController.getBookedDates);

// Get job history
router.get('/jobhistry/:id', bookingController.getJobHistory);

// Get new jobs
router.get('/api/newjob/:id', bookingController.getNewJobs);

// Get service count
router.get('/count/service/:id', bookingController.getServiceCount);

// Get service job by ID
router.get('/services/jobs/:id', bookingController.getServiceJobById);

// Get cart services
router.get('/cart/service/:id', bookingController.getCartServices);

// Get upcoming works
router.get('/upcomingworks/:id', bookingController.getUpcomingWorks);

// Create booking
router.post('/api/booking', bookingController.createBooking);

// Update booking status
router.put('/api/bookings/:id/status', bookingController.updateBookingStatus);

module.exports = router;
