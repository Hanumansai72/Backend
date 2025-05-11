const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const database = require("./models/admin");
const temporary = require("./models/vendor-register");
const productdata = require("./models/vendorproudctdetails");

const app = express();
app.use(cors());
app.use(express.json());

//const mongoURI="mongodb+srv://hanumansai72:PHxojTiAxGCBVXbJ@cluster0.lfuudui.mongodb.net/apana_mestri?retryWrites=true&w=majority&appName=Cluster0";
const mongoURI = "mongodb://127.0.0.1:27017/apana_mestri";

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Admin Login Schema
const AdminLoginSchema = new mongoose.Schema({
  login: {
    id: String,
    email: String,
    password: String
  }
}, { collection: "Admin-Login" });

const AdminLogin = mongoose.model("AdminLogin", AdminLoginSchema);

// Vendor Schema
const VendorSchema = new mongoose.Schema({
  Business_Name: String,
  Owner_name: String,
  Email_address: String,
  Phone_number: Number,
  Business_address: String,
  Category: String,
  Sub_Category: String,
  Tax_ID: String,
  Product_Name: String,
  Product_Description: String,
  Price: Number,
  Stock: Number
}, { collection: "Vendors" });

const VendorInfo = mongoose.model("Vendors", VendorSchema);

// Admin Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login:", email, password);

  try {
    const user = await AdminLogin.findOne({ "login.email": email });

    if (user) {
      if (user.login.password === password) {
        return res.json({ message: "Success" });
      } else {
        return res.json({ message: "Invalid password" });
      }
    } else {
      return res.json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all temporary vendors
app.get("/api/vendor", async (req, res) => {
  try {
    const registration_vendor = await temporary.find();
    res.json(registration_vendor);
  } catch (err) {
    console.error("Error fetching vendor registrations:", err);
    res.status(500).json({ error: "Server error fetching registrations" });
  }
});

// Register vendor
app.post("/register", (req, res) => {
  const vendorData = {
    Business_Name: req.body.Business_Name,
    Owner_name: req.body.Owner_name,
    Email_address: req.body.Email_address,
    Phone_number: req.body.Phone_number,
    Business_address: req.body.Business_address,
    Category: req.body.Category,
    Sub_Category: req.body.Sub_Category,
    Tax_ID: req.body.Tax_ID,
    Password: req.body.Password
  };

  temporary.create(vendorData)
    .then(data => {
      res.json({ message: "Registration successful", data: data });
    })
    .catch(err => {
      console.error("Error during registration:", err);
      res.status(500).json({ error: "Server error during registration" });
    });
});

// Vendor login
app.post("/postusername", async (req, res) => {
  const { username, password } = req.body;
  const lgin = await database.findOne({ "Email_address": username, "Password": password });

  if (lgin) {
    if (lgin.Password === password) {
      return res.json({ message: "Success", vendorId: lgin._id });
    } else {
      return res.json({ message: "Failed" });
    }
  } else {
    return res.json({ message: "User not found" });
  }
});

// Add vendor to main database
app.post("/add_vendor", (req, res) => {
  const vendor = {
    Business_Name: req.body.businessName,
    Owner_name: req.body.ownerName,
    Email_address: req.body.email,
    Phone_number: req.body.phone,
    Business_address: req.body.address,
    Category: req.body.category,
    Sub_Category: req.body.subCategory,
    Tax_ID: req.body.taxId,
    Product_Name: req.body.productName,
    Product_Description: req.body.productDescription,
    Price: req.body.price,
    Stock: req.body.stock
  };

  database.create(vendor)
    .then(data => {
      console.log("Vendor added:", data);
      res.json(data);
    })
    .catch(err => {
      console.error("Error adding vendor:", err);
      res.status(500).json({ error: err.message });
    });
});

// Get limited vendors
app.get("/vendors", async (req, res) => {
  try {
    const vendors = await VendorInfo.find().limit(5);
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Vendor counts
app.get("/vendor/count", async (req, res) => {
  try {
    const count = await VendorInfo.countDocuments();
    const count1 = await VendorInfo.countDocuments({ Product_Name: { $exists: true, $ne: "" } });

    res.json({ count, count1 });
  } catch (err) {
    console.log("error Fetching", err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/vendor/countofpendingrequest", async (req, res) => {
  try {
    const valueofrequest = await temporary.countDocuments();
    res.json({ valueofrequest });
  } catch (err) {
    console.log("error Fetching", err);
    res.status(500).json({ error: "server error" });
  }
});


app.post("/addproduct", async (req, res) => {
  try {
    const {
      Vendor,
      
      ProductName,
      ProductPrice,
      ProductStock,
      ProductDescription,
      ProductTags,
      ProductCategory,
      ProductSubCategory,
      ProductLocation,
      
    } = req.body;

    const newProduct = new productdata({
      Vendor,
    
      ProductName,
      ProductPrice,
      ProductStock,
      ProductDescription,
      ProductTags,
      ProductCategory,
      ProductSubCategory,
      ProductLocation
      
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({ message: "Product added successfully", product: savedProduct });
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


app.post("/postdatabase/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const vendor = await temporary.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const newVendor = {
      Business_Name: vendor.Business_Name,
      Owner_name: vendor.Owner_name,
      Email_address: vendor.Email_address,
      Phone_number: vendor.Phone_number,
      Business_address: vendor.Business_address,
      Category: vendor.Category,
      Sub_Category: vendor.Sub_Category,
      Tax_ID: vendor.Tax_ID,
      Password: vendor.Password
    };

    await database.create(newVendor);
    await temporary.findByIdAndDelete(id);

    res.json({ message: "Vendor approved and added to main database" });

  } catch (err) {
    console.error("Error processing vendor approval:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/viewproduct/:vendorId", async (req, res) => {
  const vendorId = req.params.vendorId;

  if (!vendorId || vendorId === "null") {
    return res.status(400).json({ error: "Invalid vendor ID" });
  }

  try {
    const products = await productdata.find({ Vendor: vendorId });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by vendor ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});



app.listen(8031, () => {
  console.log("Server started on http://localhost:8031");
});
