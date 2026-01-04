const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'apnamestri',
        resource_type: 'image',
        public_id: `${Date.now()}-${file.originalname}`,
    }),
});

const upload = multer({ storage });

module.exports = upload;
