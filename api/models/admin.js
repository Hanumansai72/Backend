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
  },
  Password: String,
  ID_Type: String,
  ProductUrl: String,
  Latitude: String,
  Longitude: String,

  // GeoJSON location field
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  }
}, { collection: "Temp-reg" });  // Set your intended collection name here

// Pre-save hook to populate `location` from lat/lng
VendorSchema.pre("save", function (next) {
  if (this.Latitude && this.Longitude) {
    this.location = {
      type: "Point",
      coordinates: [
        parseFloat(this.Longitude),
        parseFloat(this.Latitude)
      ]
    };
  }
  next();
});

// Add geospatial index
VendorSchema.index({ location: "2dsphere" });

const Vendor = mongoose.model("Vendor", VendorSchema);
module.exports = Vendor;
