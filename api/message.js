// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },   // e.g. "customerId_vendorId" or "a@b_c@d"
  senderId: { type: String, required: true }, // user id or email
  receiverId: { type: String, required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
