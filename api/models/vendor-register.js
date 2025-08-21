const mongoose = require("mongoose");

const tempVendorSchema = new mongoose.Schema({
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
  Charge_Type: String, // <-- Added this field (e.g., Hourly/Daily)

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
  Verified:{
    type:Boolean,
    default:false
  },
    description:String,


  registrationDate: {
    type: Date,
    default: Date.now,
  },
}, { collection: "Temp-reg" });

// Pre-save hook to populate location
tempVendorSchema.pre("save", function (next) {
  if (this.Latitude && this.Longitude) {
    this.location = {
      type: "Point",
      coordinates: [parseFloat(this.Longitude), parseFloat(this.Latitude)],
    };
  }
  next();
});

// Index for geospatial queries
tempVendorSchema.index({ location: "2dsphere" });

const TempVendor = mongoose.model("Temp-reg", tempVendorSchema);

module.exports = TempVendor;
