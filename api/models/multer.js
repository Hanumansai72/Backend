import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => {
    return {
      folder: 'apnamestri',  // Cloudinary folder
      resource_type: 'image',
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });
