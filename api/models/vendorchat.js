const mongoose = require('mongoose');
const Customer = require('./main_userprofile');
const Vendor = require('./admin');

// Define schema
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:Vendor, // Dynamic ref: can be Vendor or Customer
    required: true,
  },
  
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Customer,
    required: true,
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
module.exports = mongoose.model('Message2', messageSchema);
