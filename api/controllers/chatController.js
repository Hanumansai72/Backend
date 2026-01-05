const Conversation = require('../models/Converstion');
const Message = require('../models/Message');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary (should already be configured in app.js or config)
if (!cloudinary.config().cloud_name) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

/**
 * Get file type from MIME type
 */
const getFileType = (mimeType) => {
    if (!mimeType) return 'document';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
};

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
 * Send a text message
 */
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, senderId, senderType, message } = req.body;

        if (!conversationId || !senderId || !senderType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['user', 'vendor'].includes(senderType)) {
            return res.status(400).json({ message: 'Invalid senderType' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Authorization check
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
            message: message || '',
            messageType: 'text'
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message || '',
            lastMessageAt: new Date()
        });

        return res.status(201).json(msg);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to send message' });
    }
};

/**
 * Send a message with file attachments
 */
exports.sendMessageWithFile = async (req, res) => {
    try {
        const { conversationId, senderId, senderType, message } = req.body;
        const files = req.files || [];

        if (!conversationId || !senderId || !senderType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['user', 'vendor'].includes(senderType)) {
            return res.status(400).json({ message: 'Invalid senderType' });
        }

        // Must have message or files
        if ((!message || !message.trim()) && files.length === 0) {
            return res.status(400).json({ message: 'Message or files required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Authorization check
        if (
            (senderType === 'user' && conversation.userId.toString() !== senderId) ||
            (senderType === 'vendor' && conversation.vendorId.toString() !== senderId)
        ) {
            return res.status(403).json({ message: 'Sender not allowed in this conversation' });
        }

        // Upload files to Cloudinary
        const attachments = [];
        for (const file of files) {
            try {
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'chat_attachments',
                    resource_type: 'auto'
                });

                attachments.push({
                    url: result.secure_url,
                    type: getFileType(file.mimetype),
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype
                });
            } catch (uploadErr) {
                console.error('File upload error:', uploadErr);
            }
        }

        // If we have pre-uploaded URLs (from frontend direct upload)
        if (req.body.attachments) {
            try {
                const preUploaded = JSON.parse(req.body.attachments);
                for (const att of preUploaded) {
                    attachments.push({
                        url: att.url,
                        type: att.type || getFileType(att.mimeType),
                        fileName: att.fileName || 'file',
                        fileSize: att.fileSize || 0,
                        mimeType: att.mimeType
                    });
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }

        const msg = await Message.create({
            conversationId,
            senderId,
            senderType,
            message: message || '',
            attachments
        });

        const lastMessageText = message || (attachments.length > 0
            ? `📎 ${attachments.length} file(s)`
            : '');

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: lastMessageText,
            lastMessageAt: new Date()
        });

        return res.status(201).json(msg);
    } catch (err) {
        console.error('Send message with file error:', err);
        return res.status(500).json({ message: 'Failed to send message with file' });
    }
};

/**
 * Mark messages as seen
 */
exports.markMessagesSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { viewerId, viewerType } = req.body;

        if (!conversationId || !viewerId || !viewerType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Authorization check
        if (
            (viewerType === 'user' && conversation.userId.toString() !== viewerId) ||
            (viewerType === 'vendor' && conversation.vendorId.toString() !== viewerId)
        ) {
            return res.status(403).json({ message: 'Not authorized for this conversation' });
        }

        // Mark messages from the other party as seen
        const otherType = viewerType === 'user' ? 'vendor' : 'user';
        const result = await Message.updateMany(
            {
                conversationId,
                senderType: otherType,
                seen: false
            },
            {
                seen: true,
                seenAt: new Date()
            }
        );

        return res.status(200).json({
            message: 'Messages marked as seen',
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('Mark messages seen error:', err);
        return res.status(500).json({ message: 'Failed to mark messages as seen' });
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
        const { conversationId } = req.params;
        const { limit = 50, before } = req.query;

        let query = { conversationId };

        // Pagination: get messages before a certain timestamp
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        // Return in chronological order
        res.status(200).json(messages.reverse());
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

/**
 * Get unread message count for a user/vendor
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const { id, type } = req.params;

        if (!id || !type || !['user', 'vendor'].includes(type)) {
            return res.status(400).json({ message: 'Invalid parameters' });
        }

        // Find all conversations for this user/vendor
        const conversationField = type === 'user' ? 'userId' : 'vendorId';
        const conversations = await Conversation.find({ [conversationField]: id });

        // Count unread messages in each conversation
        const otherType = type === 'user' ? 'vendor' : 'user';
        let totalUnread = 0;

        for (const convo of conversations) {
            const unreadCount = await Message.countDocuments({
                conversationId: convo._id,
                senderType: otherType,
                seen: false
            });
            totalUnread += unreadCount;
        }

        res.status(200).json({ unreadCount: totalUnread });
    } catch (err) {
        console.error('Get unread count error:', err);
        res.status(500).json({ message: 'Failed to get unread count' });
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
