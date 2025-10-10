const mongoose = require('mongoose');
const Customer = require('./main_userprofile');
const Vendor = require('./admin');

// Define schema
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel", // dynamic reference
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "receiverModel",
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["userdata", "Vendor"],
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ["userdata", "Vendor"],
  },
  text: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

// Export model
module.exports = mongoose.model('Message', messageSchema);
