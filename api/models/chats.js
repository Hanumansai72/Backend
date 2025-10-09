const mongoose = require('mongoose');
const Customer = require('./main_userprofile');
const Vendor = require('./admin');

// Define schema
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel', // Dynamic ref: can be Vendor or Customer
    required: true,
  },
  senderModel: {
    type: String,
    required: true,
    enum: [Vendor, Customer], // ✅ use string names, not model imports
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'receiverModel',
    required: true,
  },
  receiverModel: {
    type: String,
    required: true,
    enum: [Vendor, Customer], // ✅ same here
  },
  text: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

// Export model
module.exports = mongoose.model('Message', messageSchema);
