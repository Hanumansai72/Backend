const mongoose = require("mongoose");
const vendor=require("./admin");
const Booking=require("./servicebooking")

const walletSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: vendor,
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Booking,
      },
      amount: Number,
      type: {
        type: String,
        enum: ["credit", "debit"], // credit = earning, debit = commission/withdraw
        required: true
      },
      description: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  commissionDue: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Wallet", walletSchema);
