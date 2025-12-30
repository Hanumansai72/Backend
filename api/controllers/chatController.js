const Conversation = require('../models/Converstion');
const Message = require('../models/Message');

/**
 * Get or create conversation between user and vendor
 */
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { userId, vendorId } = req.body;

        if (!userId || !vendorId) {
            return res.status(400).json({ message: 'userId and vendorId are required' });
        }

        let convo = await Conversation.findOne({ userId, vendorId });

        if (!convo) {
            convo = await Conversation.create({ userId, vendorId });
        }

        return res.status(200).json(convo);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to create conversation' });
    }
};

/**
 * Send a message
 */
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, senderId, senderType, message } = req.body;

        if (!conversationId || !senderId || !senderType || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['user', 'vendor'].includes(senderType)) {
            return res.status(400).json({ message: 'Invalid senderType' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (
            (senderType === 'user' && conversation.userId.toString() !== senderId) ||
            (senderType === 'vendor' && conversation.vendorId.toString() !== senderId)
        ) {
            return res.status(403).json({ message: 'Sender not allowed in this conversation' });
        }

        const msg = await Message.create({
            conversationId,
            senderId,
            senderType,
            message
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message,
            lastMessageAt: new Date()
        });

        return res.status(201).json(msg);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to send message' });
    }
};

/**
 * Get user inbox
 */
exports.getUserInbox = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            userId: req.params.userId
        })
            .populate('vendorId', 'Business_Name Owner_name Profile_Image')
            .sort({ lastMessageAt: -1 });

        res.status(200).json(conversations);
    } catch (err) {
        console.error('User inbox error:', err);
        res.status(500).json({ message: 'Failed to load user inbox' });
    }
};

/**
 * Get vendor inbox
 */
exports.getVendorInbox = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            vendorId: req.params.vendorId
        })
            .populate('userId', 'Full_Name Profile_Image')
            .sort({ lastMessageAt: -1 });

        res.status(200).json(conversations);
    } catch (err) {
        console.error('Vendor inbox error:', err);
        res.status(500).json({ message: 'Failed to load vendor inbox' });
    }
};

/**
 * Get messages for a conversation
 */
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

/**
 * Get all conversations for vendor
 */
exports.getVendorConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            vendorId: req.params.vendorId
        })
            .populate('userId', 'Full_Name Profile_Image')
            .sort({ lastMessageAt: -1 });

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load conversations' });
    }
};
