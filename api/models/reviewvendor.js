const mongoose = require('mongoose');
const Vendor=require("./admin")
const Product=require("./vendorproudctdetails")
const customer=require("./main_userprofile")

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Product,
    required: true
  },

vid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: customer,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Review', reviewSchema);
