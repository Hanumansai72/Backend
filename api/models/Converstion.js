const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userdata",   // UserProfile model name
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",     // Vendor model name
    required: true
  },
  lastMessage: {
    type: String,
    default: ""
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// one conversation per user–vendor pair
conversationSchema.index({ userId: 1, vendorId: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
