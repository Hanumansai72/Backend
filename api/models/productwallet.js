const mongoose = require("mongoose");
const vendor=require("./admin");

const OrderDetails = require("./productorders");

const productWalletSchema = new mongoose.Schema({
  productId: {
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
        ref: OrderDetails
      },
      amount: Number,
      commission: Number,
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

module.exports = mongoose.model("ProductWallet", productWalletSchema);
