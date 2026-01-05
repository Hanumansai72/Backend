const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["image", "document", "audio", "video"],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  senderType: {
    type: String,
    enum: ["user", "vendor"],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  message: {
    type: String,
    default: ""
  },
  messageType: {
    type: String,
    enum: ["text", "file", "mixed"],
    default: "text"
  },
  attachments: [attachmentSchema],
  seen: {
    type: Boolean,
    default: false
  },
  seenAt: {
    type: Date
  }
}, { timestamps: true });

// Validation: message or attachments must be present
messageSchema.pre('validate', function (next) {
  if (!this.message && (!this.attachments || this.attachments.length === 0)) {
    next(new Error('Message must have text content or attachments'));
  }
  next();
});

// Set messageType based on content
messageSchema.pre('save', function (next) {
  if (this.attachments && this.attachments.length > 0) {
    if (this.message && this.message.trim()) {
      this.messageType = 'mixed';
    } else {
      this.messageType = 'file';
    }
  } else {
    this.messageType = 'text';
  }
  next();
});

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
