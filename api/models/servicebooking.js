const mongoose = require('mongoose');
const vendor=require("./admin");
const userid=require("./main_userprofile")

const bookingSchema = new mongoose.Schema({
  Vendorid:{
    type:mongoose.Schema.Types.ObjectId,
     ref: vendor, 
     required: true

  },
  customerid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:userid,
    required:true


  },

  serviceDate: {
    type: Date,
    required: true
  },
  serviceTime: {
    type: String,
    required: true
  },
  customer: {
    fullName: String,
    email: String,
    phone: String,
    alternatePhone: String
  },
  address: {
    street: String,        
    city: String,
    state: String,
    zip: String,
    latitude: Number,
    longitude: Number,
    specialInstructions: String
  },
  saveAddress: {
    type: Boolean,
    default: false
  },
  payment: {
    method: String, 
    cardDetails: {
      number: String,
      expiry: String,
      cvv: String,
      nameOnCard: String
    },
    upiId: String,
    bank: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
