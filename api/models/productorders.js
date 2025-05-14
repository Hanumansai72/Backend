const mongoose = require('mongoose');
const Vendor=require("./vendor-register");


const productOrderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Vendor,
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Vendor,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Product,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  expectedDeliveryDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
});

module.exports = mongoose.model('ProductOrder', productOrderSchema);
