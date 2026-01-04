const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes - require authentication
// Get user profile
router.get('/myprofile/:id', authenticateToken, userController.getUserProfile);

// Update user profile
router.put('/myprofile/:id', authenticateToken, userController.updateUserProfile);

// Public routes
// Create user profile (signup)
router.post('/profiledata', userController.createUserProfile);

// Login user
router.post('/fetch/userprofile', userController.loginUser);

// Customer Signup (Alias for profile creation)
router.post('/customer/signup', userController.createUserProfile);

module.exports = router;

