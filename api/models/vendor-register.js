const mongoose = require("mongoose");

const data = new mongoose.Schema({
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

  // New GeoJSON location field
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
}, { collection: "Temp-reg" });

// Automatically populate `location` before saving
data.pre("save", function (next) {
  if (this.Latitude && this.Longitude) {
    this.location = {
      type: "Point",
      coordinates: [parseFloat(this.Longitude), parseFloat(this.Latitude)]
    };
  }
  next();
});

// Add 2dsphere index
data.index({ location: "2dsphere" });

const temp_register = mongoose.model("tempo", data);
module.exports = temp_register;
