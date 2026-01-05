const jwt = require('jsonwebtoken');
const Conversation = require('../models/Converstion');
const Message = require('../models/Message');

// Track online users: { odej0.3a63@userId: { odej0.3a63@socketId, type, lastSeen } }
const onlineUsers = new Map();

// Track typing status: { conversationId: { odej0.3a63@userId: timestamp } }
const typingStatus = new Map();

// Allowed origins for Socket.IO CORS
const allowedOrigins = [
    'https://www.apnamestri.com',
    'https://apnamestri.com',
    'https://partner.apnamestri.com',
    'https://product-apna-mestri.vercel.app',
    'https://vendor-apna.vercel.app',
    'https://admin-apna-mestri.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
];

/**
 * Verify JWT token from socket handshake
 */
const verifySocketToken = (socket, next) => {
    try {
        // Try to get token from auth header, query, or cookies
        const token = socket.handshake.auth?.token ||
            socket.handshake.query?.token ||
            socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];

        if (!token) {
            // Allow connection without auth for now (backward compatibility)
            // In production, you may want to reject: return next(new Error('Authentication error'));
            socket.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = {
            id: decoded.id,
            type: decoded.type || decoded.role // 'user' or 'vendor'
        };
        next();
    } catch (err) {
        // Allow connection for backward compatibility
        socket.user = null;
        next();
    }
};

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
 * Initialize Socket.IO with the server
 */
const initializeSocket = (server) => {
    const io = require('socket.io')(server, {
        cors: {
            origin: function (origin, callback) {
                // Allow requests with no origin (mobile apps, etc.)
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    console.log('Socket CORS blocked origin:', origin);
                    callback(null, true); // Allow for now, but log it
                }
            },
            credentials: true,
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(verifySocketToken);

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}${socket.user ? ` (User: ${socket.user.id})` : ''}`);

        // Track user as online
        if (socket.user) {
            const userId = socket.user.id;
            onlineUsers.set(userId, {
                socketId: socket.id,
                type: socket.user.type,
                lastSeen: new Date()
            });
            socket.broadcast.emit('userOnline', { userId, type: socket.user.type });
        }

        // Join a conversation room
        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
        });

        // Leave a conversation room
        socket.on('leaveConversation', (conversationId) => {
            socket.leave(conversationId);
            console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
        });

        // Handle typing start
        socket.on('startTyping', (data) => {
            const { conversationId, senderId, senderType } = data;
            if (!conversationId || !senderId) return;

            // Store typing status
            if (!typingStatus.has(conversationId)) {
                typingStatus.set(conversationId, new Map());
            }
            typingStatus.get(conversationId).set(senderId, Date.now());

            // Broadcast to others in the conversation
            socket.to(conversationId).emit('userTyping', {
                conversationId,
                userId: senderId,
                userType: senderType,
                isTyping: true
            });

            // Auto-clear typing after 3 seconds
            setTimeout(() => {
                const convoTyping = typingStatus.get(conversationId);
                if (convoTyping && convoTyping.get(senderId) <= Date.now() - 3000) {
                    convoTyping.delete(senderId);
                    socket.to(conversationId).emit('userTyping', {
                        conversationId,
                        userId: senderId,
                        userType: senderType,
                        isTyping: false
                    });
                }
            }, 3000);
        });

        // Handle typing stop
        socket.on('stopTyping', (data) => {
            const { conversationId, senderId, senderType } = data;
            if (!conversationId || !senderId) return;

            // Remove typing status
            const convoTyping = typingStatus.get(conversationId);
            if (convoTyping) {
                convoTyping.delete(senderId);
            }

            // Broadcast to others in the conversation
            socket.to(conversationId).emit('userTyping', {
                conversationId,
                userId: senderId,
                userType: senderType,
                isTyping: false
            });
        });

        // Handle sending messages (text only - for backward compatibility)
        socket.on('sendMessage', async (data) => {
            try {
                const { conversationId, senderId, senderType, message } = data;

                if (!conversationId || !senderId || !senderType) {
                    return socket.emit('messageError', { error: 'Missing required fields' });
                }

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    return socket.emit('messageError', { error: 'Conversation not found' });
                }

                // Verify sender belongs to this conversation
                if (
                    (senderType === 'user' && conversation.userId.toString() !== senderId) ||
                    (senderType === 'vendor' && conversation.vendorId.toString() !== senderId)
                ) {
                    return socket.emit('messageError', { error: 'Not authorized for this conversation' });
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

                // Clear typing status when message is sent
                const convoTyping = typingStatus.get(conversationId);
                if (convoTyping) {
                    convoTyping.delete(senderId);
                }

                // Emit to all in conversation including sender
                io.to(conversationId).emit('receiveMessage', msg);
            } catch (err) {
                console.error('Socket message error:', err);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Handle sending messages with attachments
        socket.on('sendMessageWithFile', async (data) => {
            try {
                const { conversationId, senderId, senderType, message, attachments } = data;

                if (!conversationId || !senderId || !senderType) {
                    return socket.emit('messageError', { error: 'Missing required fields' });
                }

                if ((!message || !message.trim()) && (!attachments || attachments.length === 0)) {
                    return socket.emit('messageError', { error: 'Message or attachments required' });
                }

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    return socket.emit('messageError', { error: 'Conversation not found' });
                }

                // Verify sender belongs to this conversation
                if (
                    (senderType === 'user' && conversation.userId.toString() !== senderId) ||
                    (senderType === 'vendor' && conversation.vendorId.toString() !== senderId)
                ) {
                    return socket.emit('messageError', { error: 'Not authorized for this conversation' });
                }

                // Process attachments
                const processedAttachments = (attachments || []).map(att => ({
                    url: att.url,
                    type: att.type || getFileType(att.mimeType),
                    fileName: att.fileName || 'file',
                    fileSize: att.fileSize || 0,
                    mimeType: att.mimeType
                }));

                const msg = await Message.create({
                    conversationId,
                    senderId,
                    senderType,
                    message: message || '',
                    attachments: processedAttachments
                });

                const lastMessageText = message || (processedAttachments.length > 0
                    ? `📎 ${processedAttachments.length} file(s)`
                    : '');

                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: lastMessageText,
                    lastMessageAt: new Date()
                });

                // Emit to all in conversation
                io.to(conversationId).emit('receiveMessage', msg);
            } catch (err) {
                console.error('Socket file message error:', err);
                socket.emit('messageError', { error: 'Failed to send message with file' });
            }
        });

        // Handle message seen
        socket.on('messageSeen', async (data) => {
            try {
                const { conversationId, viewerId, viewerType } = data;
                if (!conversationId || !viewerId) return;

                // Mark all unseen messages from the other party as seen
                const otherType = viewerType === 'user' ? 'vendor' : 'user';
                await Message.updateMany(
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

                // Notify the sender that their messages were seen
                socket.to(conversationId).emit('messagesSeen', {
                    conversationId,
                    seenBy: viewerId,
                    seenByType: viewerType,
                    seenAt: new Date()
                });
            } catch (err) {
                console.error('Message seen error:', err);
            }
        });

        // Check if a user is online
        socket.on('checkOnline', (userId, callback) => {
            const isOnline = onlineUsers.has(userId);
            const userData = onlineUsers.get(userId);
            if (callback) {
                callback({
                    online: isOnline,
                    lastSeen: userData?.lastSeen
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);

            if (socket.user) {
                const userId = socket.user.id;
                onlineUsers.delete(userId);
                socket.broadcast.emit('userOffline', {
                    userId,
                    type: socket.user.type,
                    lastSeen: new Date()
                });
            }

            // Clean up typing status for this socket
            typingStatus.forEach((users, conversationId) => {
                if (socket.user) {
                    users.delete(socket.user.id);
                }
            });
        });
    });

    return io;
};

module.exports = { initializeSocket };
