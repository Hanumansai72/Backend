const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const upload = require('../middleware/upload');

// Get vendor projects
router.get('/api/projects/:vendorId', projectController.getVendorProjects);

// Upload project
router.post('/projecteatils/vendor', upload.single('image'), projectController.uploadProject);

module.exports = router;
