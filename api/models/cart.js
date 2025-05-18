const mongoose = require('mongoose');
const userdata=require("./main_userprofile")

const cartItemSchema = new mongoose.Schema({
    Vendorid:{
    type: mongoose.Schema.Types.ObjectId,
    ref: userdata,
    required: true,
  },
      productid:String,

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
