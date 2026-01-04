const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get or create conversation
router.post('/api/chat/conversation', chatController.getOrCreateConversation);

// Send message
router.post('/api/chat/message', chatController.sendMessage);

// Get user inbox
router.get('/api/chat/inbox/user/:userId', chatController.getUserInbox);

// Get vendor inbox
router.get('/api/chat/inbox/vendor/:vendorId', chatController.getVendorInbox);

// Get messages
router.get('/api/chat/messages/:conversationId', chatController.getMessages);

// Get vendor conversations
router.get('/api/chat/conversations/vendor/:vendorId', chatController.getVendorConversations);

// Get user conversations (alias for inbox)
router.get('/api/chat/conversations/user/:userId', chatController.getUserInbox);

module.exports = router;
