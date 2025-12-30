const Conversation = require('../models/Converstion');
const Message = require('../models/Message');

/**
 * Initialize Socket.IO with the server
 */
const initializeSocket = (server) => {
    const io = require('socket.io')(server, {
        cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
        });

        socket.on('sendMessage', async (data) => {
            try {
                const conversation = await Conversation.findById(data.conversationId);
                if (!conversation) return;

                const msg = await Message.create({
                    conversationId: data.conversationId,
                    senderId: data.senderId,
                    senderType: data.senderType,
                    message: data.message
                });

                await Conversation.findByIdAndUpdate(data.conversationId, {
                    lastMessage: data.message,
                    lastMessageAt: new Date()
                });

                io.to(data.conversationId).emit('receiveMessage', msg);
            } catch (err) {
                console.error('Socket message error:', err);
            }
        });
    });

    return io;
};

module.exports = { initializeSocket };
