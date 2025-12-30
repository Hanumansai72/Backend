const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Get product reviews
router.get('/fetch/review/:rid', reviewController.getProductReviews);

// Get service reviews
router.get('/fetch/review/service/:rid', reviewController.getServiceReviews);

// Post review
router.post('/review/:vid', reviewController.postReview);

module.exports = router;
