const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const chatController = require('../controllers/chatController');

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Configure multer storage based on environment
let storage;

if (isServerless) {
    // Use memory storage for serverless (files uploaded directly to Cloudinary from frontend)
    storage = multer.memoryStorage();
} else {
    // Use disk storage for local development
    const uploadDir = path.join(__dirname, '../uploads/chat');
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    } catch (err) {
        console.log('Could not create upload directory, using memory storage:', err.message);
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '-' + file.originalname);
        }
    });
}

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'video/mp4',
        'video/webm'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, documents, audio, and video are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files per upload
    },
    fileFilter: fileFilter
});

// Get or create conversation
router.post('/api/chat/conversation', chatController.getOrCreateConversation);

// Send text message
router.post('/api/chat/message', chatController.sendMessage);

// Send message with file attachments
router.post('/api/chat/message/upload', upload.array('files', 5), chatController.sendMessageWithFile);

// Mark messages as seen
router.put('/api/chat/messages/:conversationId/seen', chatController.markMessagesSeen);

// Get user inbox
router.get('/api/chat/inbox/user/:userId', chatController.getUserInbox);

// Get vendor inbox
router.get('/api/chat/inbox/vendor/:vendorId', chatController.getVendorInbox);

// Get messages (with pagination support)
router.get('/api/chat/messages/:conversationId', chatController.getMessages);

// Get unread message count
router.get('/api/chat/unread/:type/:id', chatController.getUnreadCount);

// Get vendor conversations
router.get('/api/chat/conversations/vendor/:vendorId', chatController.getVendorConversations);

// Get user conversations (alias for inbox)
router.get('/api/chat/conversations/user/:userId', chatController.getUserInbox);

module.exports = router;
