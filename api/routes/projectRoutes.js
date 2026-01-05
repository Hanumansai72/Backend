const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const upload = require('../middleware/upload');
const { requireVendor } = require('../middleware/Rolebased');


// Get vendor projects
router.get('/api/projects/:vendorId', requireVendor(), projectController.getVendorProjects);

// Upload project
router.post('/projecteatils/vendor', requireVendor(), upload.single('image'), projectController.uploadProject);

module.exports = router;
