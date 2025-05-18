const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const database = require("./models/admin");
const temporary = require("./models/vendor-register");
const productdata = require("./models/vendorproudctdetails");
const vieworder=require("./models/productorders")
const cart=require("./models/cart")
const app = express();
app.use(cors());
app.use(express.json());
const multer = require("multer");
const cloudinary = require("./models/cloudinary"); 
const UserMain=require("./models/main_userprofile")

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoURI="mongodb+srv://hanumansai72:PHxojTiAxGCBVXbJ@cluster0.lfuudui.mongodb.net/apana_mestri?retryWrites=true&w=majority&appName=Cluster0";
//const mongoURI = "mongodb://127.0.0.1:27017/apana_mestri";

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const AdminLoginSchema = new mongoose.Schema({
  login: {
    id: String,
    email: String,
    password: String
  }
}, { collection: "Admin-Login" });

const AdminLogin = mongoose.model("AdminLogin", AdminLoginSchema);

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

app.get("/api/vendor", async (req, res) => {
  try {
    const registration_vendor = await temporary.find();
    res.json(registration_vendor);
  } catch (err) {
    console.error("Error fetching vendor registrations:", err);
    res.status(500).json({ error: "Server error fetching registrations" });
  }
});

app.post("/api/cart", async (req, res) => {
  const {
    Vendorid,
    productid,
    producturl,
    productname,
    productQuantity,
    productprice,
    productvendor
  } = req.body;

  if (!Vendorid || !mongoose.Types.ObjectId.isValid(Vendorid)) {
    return res.status(400).json({ message: "Invalid or missing Vendorid" });
  }

  if (!producturl || !productname || !productQuantity || !productprice) {
    return res.status(400).json({ message: "Missing required product fields" });
  }

  try {
    const cartItem = new cart({
      Vendorid,
      productid,
      producturl,
      productname,
      productQuantity,
      productprice,
      productvendor: productvendor || "Unknown Vendor"
    });

    const savedItem = await cartItem.save();
    res.status(201).json({ message: "Added to cart", cartItem: savedItem });
  } catch (error) {
    console.error("Failed to add to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/carts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const usercarts = await cart.find({ Vendorid: id });  // or findOne
    res.json(usercarts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/cart/:id/count",async (req,res)=>{
  try{
    const cartid =req.params.id;
    const countcart=await cart.countDocuments({Vendorid:cartid});
    res.json({count:countcart})
  }
  catch(err){
        res.status(500).json({ error: err.message });

  }
})
app.delete("/delete/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const deletedItem = await cart.findOneAndDelete({
      _id: itemId,
    });

    if (!deletedItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});



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
app.put("/update/userdetailes/:id",async (req,res)=>{
  const userid=req.params.id;
  const {
    Business_Name,
    Owner_name,
    Email_address,
    Phone_number,
    Business_address,
    Tax_ID,
    Password
  }=req.body
  const upatedesahhs=await database.findByIdAndUpdate(userid,{
    Business_Name,
    Owner_name,
    Email_address,
    Phone_number,
    Business_address,
    Tax_ID,
    Password
  },{ new: true }
  );

  res.status(200).json({ message: "User updated", data: upatedesahhs });
});

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
    Stock: req.body.stock,
    Password:req.body.password
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

app.get("/vendors", async (req, res) => {
  try {
    const vendors = await VendorInfo.find().limit(10);
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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
app.get("/:id/settings",async(req,res)=>{
  try{
    const vendorsid=  req.params.id;
    const datasettings= await database.findById(vendorsid)
    res.json({datasettings})
  }
  catch(err){
    res.json("got an error",err)

  }
})


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_images",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage: storage });

app.post("/addproduct", upload.single("productImage"), async (req, res) => {
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
      ProductUrl
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
      ProductLocation,
      ProductUrl,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ message: "Product uploaded successfully", product: savedProduct });

  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
app.post("/profiledata",async (req, res) => {
  const {
    Full_Name,
    Emailaddress,
    Phone_Number,
    Password,
    Location
  } = req.body;

  const dataprofile = {
    Full_Name,
    Emailaddress,
    Phone_Number,
    Password,
    Location
  };

  UserMain.create(dataprofile)
    .then(data => {
      console.log("Response saved successfully", data);
      res.status(201).json({ message: "Profile saved successfully", data });
    })
    .catch(err => {
      console.error("Failed to save data:", err);
      res.status(500).json({ error: "Failed to save profile data" });
    });
});

app.post("/fetch/userprofile", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserMain.findOne({ Emailaddress: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.Password === password) {
      return res.status(200).json({ message: "Success", user , userId: user._id 
});
    } else {
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
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
app.get("/wow", async (req, res) => {
  try {
    const count = await vieworder.countDocuments();
    const all = await vieworder.find();

    console.log({ count, all }); 

    res.json({ count, all }); 
  } catch (err) {
    console.error("Error counting documents:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/pending-orders', async (req, res) => {
  try {
    const pendingOrders = await vieworder.find({ orderStatus: 'Pending' });
    res.status(200).json(pendingOrders);
  } catch (err) {
    console.error('Error fetching pending orders:', err);
    res.status(500).json({ message: 'Internal server error' });
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
app.get("/api/categories/:id", async (req, res) => {
  try {
    const vendor = await database.findById(req.params.id).select("Category");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});
app.put("/updatedetails/:productId", async (req, res) => {
  const { productId } = req.params;
  const {
    ProductName,
    ProductPrice,
    ProductStock,
    ProductDescription,
    ProductCategory,
    ProductSubCategory,
    ProductTags,
    ProductLocation,
  } = req.body;

  try {
    const updatedProduct = await productdata.findByIdAndUpdate(
      productId,
      {
        ProductName,
        ProductPrice,
        ProductStock,
        ProductDescription,
        ProductCategory,
        ProductSubCategory,
        ProductTags,
        ProductLocation,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully", product: updatedProduct });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
app.delete("/delete/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const deletedProduct = await productdata.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/fetch", async (req, res) => {
  const { category } = req.query;

  try {
    const query = category
      ? { ProductCategory: { $regex: new RegExp(category, "i") } }
      : {};

    const products = await productdata.find(query).lean();

    if (!products.length) {
      return res.status(404).json({ message: "No products found" });
    }


    
    

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products with vendors:", err);
    res.status(500).json({ error: "Server error" });
  }
});
  app.get("/product/:id", async (req, res) => {
  try {
    const product = await productdata.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const vendor = await database.findById(product.Vendor); // manually get the vendor

    res.json({
      ...product.toObject(),
      Vendor: vendor  // replace the ID with the full vendor object
    });
  } catch (err) {
    console.error("Error fetching product or vendor:", err);
    res.status(500).json({ message: "Server error" });
  }
});



app.listen(8031, () => {
  console.log("Server started on http://localhost:8031");
});
