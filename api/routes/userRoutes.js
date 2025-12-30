const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get user profile
router.get('/myprofile/:id', userController.getUserProfile);

// Create user profile
router.post('/profiledata', userController.createUserProfile);

// Login user
router.post('/fetch/userprofile', userController.loginUser);

// Update user profile
router.put('/myprofile/:id', userController.updateUserProfile);

// Customer Signup (Alias for profile creation)
router.post('/customer/signup', userController.createUserProfile);

module.exports = router;
