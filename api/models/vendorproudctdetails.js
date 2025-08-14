const mongoose = require("mongoose");
const Vendor=require("./vendor-register");

const productSchema = new mongoose.Schema({
  Vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Vendor, 
    required: true
  },
  ProductName: String,
  ProductPrice: String,
  ProductStock: String,
  ProductDescription: String,
  ProductReview: {
    type: Number,
    default: 0
  },
  ProductOrderPlaces: {
    type: Number,
    default: 0
  },
  
  ProductCategory: String,
  ProductSubCategory: String,
  ProductTags:String,
  ProductLocation:String,
  isAvailable: {
      type: Boolean,
      default: true,
    },
    ProductUrl: [String], 

}, { collection: "Product_Vendor" });

const ProductModel = mongoose.model("Product_Vendor", productSchema);
module.exports = ProductModel;
