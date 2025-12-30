const projectupload = require('../models/projectuplad');

/**
 * Get projects for a vendor
 */
exports.getVendorProjects = async (req, res) => {
    try {
        const projects = await projectupload.find({ VendorID: req.params.vendorId });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: '❌ Server error' });
    }
};

/**
 * Upload a new project
 */
exports.uploadProject = async (req, res) => {
    try {
        const { title, description, category, vendorId } = req.body;

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'Image upload failed' });
        }

        const project = new projectupload({
            VendorID: vendorId,
            title,
            description,
            category,
            image: req.file.path,
        });

        await project.save();
        res.status(201).json({ message: ' Project uploaded successfully', project });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
