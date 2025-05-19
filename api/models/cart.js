const mongoose = require('mongoose');
const userprofile=require("./main_userprofile")
const vendor=require("./admin")

const cartItemSchema = new mongoose.Schema({
  customerid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: userprofile, 
    required: true,
  },
  Vendorid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: vendor, // Ensure "Vendor" matches the mongoose.model name for vendor
    required: true,
  },
  productid: {
    type: String,
    required: true,
  },
  producturl: {
    type: String,
    required: true,
  },
  productname: {
    type: String,
    required: true,
  },
  productQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  productprice: {
    type: Number,
    required: true,
    min: 0,
  },
  productvendor: {
    type: String,
    default: 'Unknown Vendor',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CartItem = mongoose.model('CartItem', cartItemSchema);
module.exports = CartItem;
