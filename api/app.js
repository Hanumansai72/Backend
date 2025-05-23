const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const productdata = require("./models/vendorproudctdetails");
const vieworder=require("./models/productorders")
const CartItem=require("./models/cart")
const app = express();
const revieworder=require("./models/reviewvendor")
const axios = require("axios"); 
const https = require("https");
const { OpenAI } = require("openai");
const booking_service=require("./models/servicebooking")
const TempVendor = require("./models/vendor-register");
const Vendor = require("./models/admin");




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


const client = new OpenAI({
  baseURL: "https://router.huggingface.co/nebius/v1",
  apiKey: "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", 
});

async function generateDescription(category, subCategory) {
  const prompt = `Write a short product description and relevant comma-separated tags for a product in the category "${category}" and sub-category "${subCategory}". Format like this:

Product Description: <text>
ProductTags: <tag1>, <tag2>, ...`;

  const chatCompletion = await client.chat.completions.create({
    model: "Qwen/Qwen3-32B",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return chatCompletion.choices[0].message.content;
}


app.post("/generate-content", async (req, res) => {
  const { category, subCategory } = req.body;

  try {
    const resultText = await generateDescription(category, subCategory);

const descriptionMatch = resultText.match(/Product Description:\s*(.*?)\s*ProductTags:/s);
const tagsMatch = resultText.match(/ProductTags:\s*(.*)/s);
console.log("sai:",descriptionMatch)
const description = descriptionMatch ? descriptionMatch[1].trim() : "";
const tags = tagsMatch ? tagsMatch[1].trim() : "";

res.json({
  content: {
    des: description,
    tag: tags,
  },
});


  } catch (error) {
    console.error("API error:", error.message || error.response?.data);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

app.get("/api/vendor", async (req, res) => {
  try {
    const registration_vendor = await TempVendor.find();
    res.json(registration_vendor);
  } catch (err) {
    console.error("Error fetching vendor registrations:", err);
    res.status(500).json({ error: "Server error fetching registrations" });
  }
});

app.post("/api/cart", async (req, res) => {
  const {
    customerid,
    Vendorid,
    productid,
    producturl,
    productname,
    productQuantity,
    productprice,
    productvendor
  } = req.body;

  if (!customerid || !mongoose.Types.ObjectId.isValid(customerid)) {
    return res.status(400).json({ message: "Invalid or missing customerid" });
  }

  if (!Vendorid || !mongoose.Types.ObjectId.isValid(Vendorid)) {
    return res.status(400).json({ message: "Invalid or missing Vendorid" });
  }

  if (!producturl || !productname || !productQuantity || !productprice) {
    return res.status(400).json({ message: "Missing required product fields" });
  }

  try {
    const cartItem = new CartItem({
      customerid,
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
    const usercarts = await CartItem.find({ customerid: id });  
    res.json(usercarts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/cart/:id/count",async (req,res)=>{
  try{
    const cartid =req.params.id;
    const countcart=await CartItem.countDocuments({Vendorid:cartid});
    res.json({count:countcart})
  }
  catch(err){
        res.status(500).json({ error: err.message });

  }
})
app.get("/")
app.put("/update-order-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const updatedOrder = await vieworder.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    res.status(200).json({ message: "Order status updated", updatedOrder });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/pending-orders/:id', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {
      vendorid: req.params.id,
      orderStatus: 'Pending' 
    };

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await vieworder.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await vieworder.countDocuments(query);

    res.status(200).json({ orders, total });
  } catch (err) {
    console.error('Error fetching pending orders:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.delete("/delete/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const deletedItem = await CartItem.findOneAndDelete({
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




app.post("/register", async (req, res) => {
 try {
    const {
      Business_Name, Owner_name, Email_address, Phone_number, Business_address,
      Category, Sub_Category, Tax_ID, Password, Latitude, Longitude,
      ProductUrl, ID_Type
    } = req.body;

    const vendor = new TempVendor({
      Business_Name, Owner_name, Email_address, Phone_number, Business_address,
      Category, Sub_Category: Array.isArray(Sub_Category) ? Sub_Category : [Sub_Category],
      Tax_ID, Password, Latitude, Longitude, ProductUrl, ID_Type
    });

    await vendor.save();
    res.json({ message: "Registration successful" });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
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
  const upatedesahhs=await Vendor.findByIdAndUpdate(userid,{
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
  const lgin = await Vendor.findOne({ "Email_address": username, "Password": password });

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
  const vendors = {
    Business_Name: req.body.Business_Name,
    Owner_name: req.body.Owner_name,
    Email_address: req.body.Email_address,
    Phone_number: req.body.Phone_number,
    Business_address: req.body.Business_address,
    Category: req.body.Category,
    Sub_Category: req.body.Sub_Category,
    Tax_ID: req.body.Tax_ID,
    Password: req.body.Password,
    Latitude: req.body.Latitude,
    Longitude: req.body.Longitude,
    ProductUrl: req.body.ProductUrl,
  };

  // Save to MongoDB using your Vendor model
  Vendor.create(vendors)
    .then(data => {
      console.log("Vendor added:", data);
      res.status(200).json({ message: "Vendor added successfully", data });
    })
    .catch(err => {
      console.error("Error adding vendor:", err);
      res.status(500).json({ error: "Failed to add vendor", details: err.message });
    });
});

  



  
  

app.get("/vendors", async (req, res) => {
  try {
    const vendors = await Vendor.find().limit(10);
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
    const valueofrequest = await TempVendor.countDocuments();
    res.json({ valueofrequest });
  } catch (err) {
    console.log("error Fetching", err);
    res.status(500).json({ error: "server error" });
  }
});
app.get("/:id/settings",async(req,res)=>{
  try{
    const vendorsid=  req.params.id;
    const datasettings= await Vendor.findById(vendorsid)
    res.json({datasettings})
  }
  catch(err){
    res.json("got an error",err)

  }
})
app.get("/myprofile/:id",async (req,res)=>{
  try{
    const id=req.params.id
    const myprofileid=await UserMain.findById(id);
    res.json(myprofileid)

  }
  catch(err){
    res.json(err)
  }
})


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_images",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const storages = multer.memoryStorage();
const upload = multer({ storage: storages });
app.get("/fetch/review/:rid",async(req,res)=>{
  try{
  const rid=req.params.rid;
  const getreview=await revieworder.find({productId:rid})
  res.json({getreview})

  }
  catch(err){
    res.json({err})

  }

})
app.post("/review/:vid", async (req, res) => {
  try {
    const vid = req.params.vid;

    const {
      productId,
      customerName,
      rating,
      comment
    } = req.body;

    const revieorders = new revieworder({
      productId,
      vid, 
      customerName,
      rating,
      comment
    });

    const savingreview = await revieorders.save();
    res.status(201).json({
      message: "Review uploaded successfully",
      review: savingreview
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


app.post("/addproduct", upload.array("productImages", 5), async (req, res) => {
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

    // Assuming you've already uploaded to Cloudinary and received secure URLs in req.body.ProductUrls (array)
    const ProductUrls = req.body.ProductUrl;

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
      ProductUrl: ProductUrls, // store as array
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
    // Find vendor in temp collection
    const vendor = await TempVendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found in temporary collection" });
    }

    // Prepare new vendor data for main collection
    const newVendorData = {
      Business_Name: vendor.Business_Name,
      Owner_name: vendor.Owner_name,
      Email_address: vendor.Email_address,
      Phone_number: vendor.Phone_number,
      Business_address: vendor.Business_address,
      Category: vendor.Category,
      Sub_Category: vendor.Sub_Category,
      Tax_ID: vendor.Tax_ID,
      Password: vendor.Password,
      ID_Type: vendor.ID_Type,
      ProductUrl: vendor.ProductUrl,
      Latitude: vendor.Latitude,
      Longitude: vendor.Longitude,
      registrationDate: vendor.registrationDate,
    };

    await Vendor.create(newVendorData);

    await TempVendor.findByIdAndDelete(id);

    res.json({ message: "Vendor approved and added to main database" });

  } catch (error) {
    console.error("Error processing vendor approval:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/wow/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await vieworder.countDocuments({ vendorid: id });
    const all = await vieworder.find({ vendorid: id })
      .sort({ orderedAt: -1 }) // optional: sort by latest first
      .skip(skip)
      .limit(limit);

    res.json({ total, all });
  } catch (err) {
    console.error("Error fetching paginated orders:", err);
    res.status(500).json({ error: "Internal Server Error" });
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
    const vendor = await Vendor.findById(req.params.id).select("Category");
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


app.get('/fetch/services', async (req, res) => {
  const { category, lat, lng } = req.query;

  if (!category) {
    return res.status(400).json({ message: "Missing category parameter" });
  }

  try {
    let services = [];

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      services = await Vendor.find({
        Sub_Category: { $regex: new RegExp(`^${category.trim()}$`, "i") },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [userLng, userLat]
            },
            $maxDistance: 5000 // 5 km
          }
        }
      });

      if (services.length === 0) {
        services = await Vendor.find({
          Sub_Category: { $regex: new RegExp(`^${category.trim()}$`, "i") }
        }).limit(10); // show top 10 results
      }
    } else {
      services = await Vendor.find({
        Sub_Category: { $regex: new RegExp(`^${category.trim()}$`, "i") }
      });
    }

    // AI-generated content
    let generatedDescription = '';
    let generatedTags = [];

    try {
      const aiResult = await generateDescription(category);

      const descMatch = aiResult.match(/Product Description:\s*(.+)/i);
      const tagsMatch = aiResult.match(/ProductTags:\s*(.+)/i);

      generatedDescription = descMatch ? descMatch[1].trim() : '';
      generatedTags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
    } catch (err) {
      console.error("AI Generation failed:", err);
    }

    res.json({
      services,
      description: generatedDescription,
      tags: generatedTags
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post("/api/booking",async(req,res)=>{
  try{
    const booking=new booking_service(req.body)
    await booking.save();
res.status(200).json({ message: 'Booking saved successfully', booking });
  } catch (err) {
    console.error('Booking Save Error:', err);
    res.status(500).json({ error: 'Failed to save booking' });
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

    const productsWithReviewCount = await Promise.all(
      products.map(async (product) => {
        try {
          const reviewCount = await revieworder.countDocuments({
            productId: mongoose.Types.ObjectId(product._id),
          });
          return { ...product, ProductReview: reviewCount };
        } catch (err) {
          console.error(`Error counting reviews for product ${product._id}:`, err);
          return { ...product, ProductReview: 0 };
        }
      })
    );

    res.status(200).json(productsWithReviewCount);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Server error" });
  }
});
  app.get("/product/:id", async (req, res) => {
  try {
    const product = await productdata.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const vendor = await Vendor.findById(product.Vendor); // manually get the vendor

    res.json({
      ...product.toObject(),
      Vendor: vendor  
    });
  } catch (err) {
    console.error("Error fetching product or vendor:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/related-products/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { exclude } = req.query;  

    const related = await productdata.find({
      ProductCategory: category,
      _id: { $ne: exclude }
    }).limit(4);

    res.json(related);
  } catch (err) {
    console.error("Error fetching related products:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post('/ordercart', async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) return res.status(400).json({ error: "Orders must be an array." });

    const created = await vieworder.insertMany(orders);
    res.status(201).json(created);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/orderdetails/:id",async (req,res)=>{
  try {
    const id=req.params.id
    const ordercustomer=await vieworder.find({customerId:id})
    res.json(ordercustomer)
    
  }
  catch(err){
    res.json(err)

  }
})
app.get("/api/newjob/:id",async(req,res)=>{
  const id=req.params.id
  try{
    const findingnewjob=await booking_service.find({Vendorid:id,      status: { $ne: "Completed" } // Exclude bookings with status "Completed"
})
    res.json(findingnewjob)
  }
  catch(err){
    res.json(err)
  }
})
// In your booking controller or route file
app.put('/api/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const updatedBooking = await booking_service.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});
app.get("/jobhistry/:id",async(req,res)=>{
    const id=req.params.id;
    try{
      const databse1=await booking_service.find({Vendorid:id,status:"Completed"})
      res.json(databse1)
    }
    catch(err){
      res.json(err)
    }


})
app.get("/count/service/:id",async(req,res)=>{
  const id=req.params.id;
  try{
    const count1=await booking_service.countDocuments({Vendorid:id,status:"Pending"})
        const count2=await booking_service.countDocuments({Vendorid:id,status:"Completed"})
        


    res.json({count1:count1,count2:count2})
  }
  catch(err){
    console.log(err)
  }
})
app.get("/services/jobs/:id",async(req,res)=>{
  const id=req.params.id;
  try{
    const findingserviceid= await booking_service.findById(id)
    res.json(findingserviceid)
  }
  catch(err){
    res.json(err)
  }
})
app.get("/cart/service/:id",async(req,res)=>{
  const id=req.params.id
  try{
    const cartservice=await booking_service.find({customerid:id})
    res.json(cartservice)
  }
  catch(err){
    console.log(err)
  }
})


app.listen(8031, () => {
  console.log("Server started on http://localhost:8031");
});
