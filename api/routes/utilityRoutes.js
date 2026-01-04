const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');
const { getCacheStats } = require('../config/redis');

// Get services by category
router.get('/fetch/services', utilityController.getServicesByCategory);

// Generate AI content
router.post('/generate-content', utilityController.generateContent);

// Cache stats (for monitoring)
router.get('/cache-stats', (req, res) => {
    res.json(getCacheStats());
});

module.exports = router;

