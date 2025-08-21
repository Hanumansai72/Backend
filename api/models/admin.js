const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  Business_Name: String,
  Owner_name: String,
  Email_address: String,
  Phone_number: String,
  Business_address: String,
  Category: String,
  Sub_Category: [String],
  Tax_ID: String,
  ID_Type: String,
  Password: String,

  ProductUrls: { type: [String], default: [] }, // Multiple product/business images
  Profile_Image: { type: String, default: "" }, // Single profile image

  Account_Number: String,
  IFSC_Code: String,
  Charge_Per_Hour_or_Day: String,
  Charge_Type: String, // <-- Added here

  Latitude: String,
  Longitude: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  description:String,

  registrationDate: {
    type: Date,
    default: Date.now,
  },
}, { collection: "Vendor-main" });

// Pre-save hook to populate location
vendorSchema.pre("save", function (next) {
  if (this.Latitude && this.Longitude) {
    this.location = {
      type: "Point",
      coordinates: [parseFloat(this.Longitude), parseFloat(this.Latitude)],
    };
  }
  next();
});

// Index for geospatial queries
vendorSchema.index({ location: "2dsphere" });

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
