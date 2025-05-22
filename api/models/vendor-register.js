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
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  Password: String,
  ID_Type: String,
  ProductUrl: String,
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
}, { collection: "Temp-reg" }); // Temporary vendors stored here

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
