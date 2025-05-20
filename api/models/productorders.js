const mongoose = require("mongoose");
const vendor=require("./admin")

const orderDetailsSchema = new mongoose.Schema({
  vendorid:{
    type: mongoose.Schema.Types.ObjectId,
    ref: vendor,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String 
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: false 
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },

  shippingAddress: {
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
  },

  orderStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },

  orderedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("OrderDetails", orderDetailsSchema);
