const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const database = require("./models/admin");

const app = express();
app.use(cors());
app.use(express.json());

//const mongoURI = "mongodb://127.0.0.1:27017/apana_mestri";
const mongoURI="mongodb+srv://hanumansai72:PHxojTiAxGCBVXbJ@cluster0.lfuudui.mongodb.net/apana_mestri?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Admin login schema
const AdminLoginSchema = new mongoose.Schema({
  login: {
    id: String,
    email: String,
    password: String
  }
}, { collection: "Admin-Login" });

const AdminLogin = mongoose.model("AdminLogin", AdminLoginSchema);

// Vendor info schema
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

// Admin login route
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

// Add vendor route
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

// Get all vendors route
app.get("/vendors", async (req, res) => {
  try {
    const vendors = await VendorInfo.find().limit(5);
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/vendor/count",async (req,res)=>{
  try{
    const count=await VendorInfo.countDocuments();
    const count1 = await VendorInfo.countDocuments({ Product_Name: { $exists: true, $ne: "" } });

    res.json({ count,count1 })

  }catch(err){
    console.log("error Fecthing",err)
    res.status(500).json({error:"server error"})
  }
})

app.listen(8031, () => {
  console.log("Server started on http://localhost:8031");
});
