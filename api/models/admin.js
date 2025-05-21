const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({

  Business_Name: String,
  Owner_name: String,
  Email_address: String,
  Phone_number: String,
  Business_address: String,
  Category: String,
  Sub_Category: [String],
  Tax_ID: String,
  registrationDate: {
    type: Date,
    default: Date.now  
  },  Password:String,
  ProductUrl:String,
    ID_Type:String,
    Latitude: String,
  Longitude: String


}, { collection: "Vendors" }); 

const Vendor = mongoose.model("Vendor", VendorSchema);
module.exports = Vendor;
