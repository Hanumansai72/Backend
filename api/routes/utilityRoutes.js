const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

// Get services by category
router.get('/fetch/services', utilityController.getServicesByCategory);

// Generate AI content
router.post('/generate-content', utilityController.generateContent);

module.exports = router;
