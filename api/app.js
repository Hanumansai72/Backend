const express = require("express");
const mongoose = require("mongoose");
const projectupload=require("./models/projectuplad")

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
const nodemailer = require('nodemailer');
const bcrypt=require("bcrypt")
const otpsender=require("./models/otpschema")
const ratelimter=require("express-rate-limit")
const hemlet=require("helmet")
require('dotenv').config();
const productwallet=require("./models/productwallet")
const Wallet=require("./models/wallet")
const chats=require("./models/chats")
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});


const cors = require('cors');
app.set('trust proxy', 1);
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dqxsgmf33",
  api_key: "188635975854673",
  api_secret:"XT91-J2eY6-G7TFFlwAiwglYPiQ"
});



const limiter=ratelimter(
  {
    windowMs:15*60*1000,
    max:100,
    message:"Too many request Please try again"
  }
)
app.use(limiter);

app.use(cors()); 
app.use(hemlet());




app.use(express.json());

const UserMain=require("./models/main_userprofile")

const mongoURI=process.env.mongoURI_perment;

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
const AdminLogin = mongoose.models.AdminLogin || mongoose.model("AdminLogin", AdminLoginSchema);



const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "94b255001@smtp-brevo.com", // Brevo SMTP login
    pass: "JPHqgGOcYjv8CN04",         // Brevo master password
  }
});
function register(email,name,htmlContents,subject){

const mailOption = {
    from: '"Apna Mestri" <help@apnamestri.com>',
    to: email,
    subject:subject ,
    html: htmlContents,
  };
    return transporter.sendMail(mailOption);

}
function sendOTP(email, otp) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>OTP Verification - Apna Mestri</h2>
      <p>Hello,</p>
      <p>Thank you for registering with <strong>Apna Mestri</strong>.</p>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="background: #f2f2f2; display: inline-block; padding: 10px 20px; color: #000; border-radius: 5px;">
        ${otp}
      </h1>
      <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      <p>Best regards,<br><strong>Apna Mestri Team</strong></p>
    </div>
  `;

  const mailOptions = {
    from: '"Apna Mestri" <help@apnamestri.com>',
    to: email,
    subject: "Your OTP Code",
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
}
async function addProductTransaction(vendorid, orderId, totalAmount) {
  let wallet = await productwallet.findOne({ vendorid });

  // If wallet doesn't exist, create it
  if (!wallet) {
    wallet = new productwallet({
      vendorid,
      balance: 0,
      commissionDue: 0,
      transactions: []
    });
  }

  // Commission is 5%
  const commission = totalAmount * 0.05;
  const vendorEarning = totalAmount - commission;

  // Add transaction
  wallet.transactions.push({
    orderId,
    amount: vendorEarning,
    commission,
    type: "credit",
    description: `Payment received for Order #${orderId}`
  });

  // Update balance & commissionDue
  wallet.balance += vendorEarning;
  wallet.commissionDue += commission;

  await wallet.save();
  return wallet;
}
app.post('/api/messages', async (req, res) => {
  try {
    const newMessage = new chats(req.body);
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const messages = await chats.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ time: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SOCKET.IO Real-Time Communication
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Join room (based on vendor or customer ID)
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room`);
  });

  // Send message event
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, senderModel, receiverId, receiverModel, text } = data;

      // Save to database
      const newMessage = new chats({
        senderId,
        senderModel,
        receiverId,
        receiverModel,
        text,
      });
      await newMessage.save();

      // Emit to receiver room
      io.to(receiverId).emit('receiveMessage', newMessage);
      io.to(senderId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });});

app.post("/google-login/customer", async (req, res) => {
  const { email, name } = req.body;

  try {
    // Check if user exists
    let user = await UserMain.findOne({ Emailaddress: email });

    // Create new user if not exists
    if (!user) {
      user = await UserMain.create({
        Full_Name: name,
        Emailaddress: email
      });
    }

    // Send success response
    res.json({ message: "Success", user });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({
      message: "Google login failed",
      error: err.message
    });
  }
});

// API Route
app.get("/product-wallet/:vendorid", async (req, res) => {
  try {
    const { vendorid } = req.params;

    // 1. Find or create wallet
    let wallet = await productwallet.findOne({ vendorid });
    if (!wallet) {
      wallet = new productwallet({
        vendorid,
        balance: 0,
        commissionDue: 0,
        transactions: []
      });
      await wallet.save();
    }

    // 2. Get all completed & paid orders for this vendor
    const completedOrders = await vieworder.find({
      vendorid,
      orderStatus: "Delivered",
      paymentStatus: "Paid"
    });

    // 3. For each order, check if already added
    for (const order of completedOrders) {
      const exists = wallet.transactions.some(
        txn => txn.orderId.toString() === order._id.toString()
      );

      if (!exists) {
        wallet = await addProductTransaction(
          vendorid,
          order._id,
          order.totalPrice
        );
      }
    }

    res.json(wallet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function addTransaction(vendorId, orderId, totalAmount) {
  let wallet = await Wallet.findOne({ vendorId });

  if (!wallet) {
    wallet = new Wallet({ vendorId, balance: 0, commissionDue: 0, transactions: [] });
  }

  // Calculate commission (5%)
  const commission = totalAmount * 0.05;
  const vendorEarning = totalAmount - commission;

  // Add transaction for vendor earning
  wallet.transactions.push({
    orderId,
    amount: vendorEarning,
    type: "credit",
    commission,
    description: `Payment received for Order #${orderId}`,
  });

  // Update wallet balance and commissionDue
  wallet.balance += vendorEarning;
  wallet.commissionDue += commission;

  await wallet.save();
  return wallet;
}


app.get("/wallet/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    // 1. Find or create wallet
    let wallet = await Wallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new Wallet({ vendorId, balance: 0, commissionDue: 0, transactions: [] });


      await wallet.save();
    }

    // 2. Get all completed bookings of vendor
    const completedBookings = await booking_service.find({
      Vendorid: vendorId,
      status: "Completed",
    });

    // 3. For each booking, check if already added to wallet
    for (const booking of completedBookings) {
      const alreadyExists = wallet.transactions.some(
        (txn) => txn.orderId.toString() === booking._id.toString()
      );

      if (!alreadyExists) {
        // 💰 Add transaction with commission
        wallet = await addTransaction(
          vendorId,
          booking._id,
          booking.totalAmount
        );
      }
    }

    // 4. Return updated wallet
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sendotp", async (req, res) => {
  try {
    const { Email } = req.body;
    if (!Email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Remove any old OTPs for the same email
    await otpsender.deleteMany({ Email });

    // Save OTP in DB
    const newOtp = new otpsender({ Email, Otp: otpCode });
    await newOtp.save();

    // Send the OTP email
    await sendOTP(Email, otpCode);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in sendotp:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



app.post("/verifyotp", async (req, res) => {
  const { Email, otp } = req.body;

  try {
    const verifyOtp = await otpsender.findOne({ Email: Email, Otp: otp });

    if (verifyOtp) {
      res.status(200).json({ message: "OTP verified" });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/loginwith-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const vendor = await Vendor.findOne({ Email_address: email });
    if (!vendor) {
      return res.json({ message: "User not found" });
    }

    return res.json({ message: "Success", vendorId: vendor._id });
  } catch (err) {
    console.error("Login with OTP error:", err);
    return res.status(500).json({ message: "Server error during login with OTP" });
  }
});

app.put("/forgetpassword", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const user = await UserMain.findOne({ Emailaddress: email });

    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user.Password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Error in forget password:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login:", email, password);

  try {
    const user = await AdminLogin.findOne({ "login.email": email });

    if (!user) {
      return res.json({ message: "User not found" });
    }


    if (password==user.login.password) {
      return res.json({ message: "Success" });
    } else {
      return res.json({ message: "Invalid password" });
    }

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


const client = new OpenAI({
  baseURL: "https://router.huggingface.co/nebius/v1",
  apiKey: process.env.API_KEY_HUGGEFACE, 
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
      orderStatus: { $in: ['Pending', 'Processing'] }  // ✅ fixed
    };

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const orders = await vieworder.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await vieworder.countDocuments(query);

    res.status(200).json({ orders, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('Error fetching pending orders:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get("/vendor", async (req, res) => {
  try {
    // Fetch all vendors from the database
    const vendors = await Vendor.find();

    // Send the list of vendors as JSON
    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      message: "Server Error. Could not fetch vendors."
    });
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


const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'apnamestri',          // Cloudinary auto-creates folder
    resource_type: 'image',
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

const upload = multer({ storage });



// Use upload.fields() for multiple images + single profile
app.post(
  "/register",
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "profileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        Business_Name,
        Owner_name,
        Email_address,
        Phone_number,
        Business_address,
        Category,
        Sub_Category,
        Tax_ID,
        Password,
        Latitude,
        Longitude,
        ID_Type,
        Account_Number,
        IFSC_Code,
        Charge_Type,
        Charge_Per_Hour_or_Day,
        description,
        isGoogleSignup // 👈 flag from frontend
      } = req.body;

      // ✅ Check duplicate email in BOTH collections
      const [existingVendor, existingTempVendor] = await Promise.all([
        Vendor.findOne({ Email_address }),
        TempVendor.findOne({ Email_address }),
      ]);

      if (existingVendor || existingTempVendor) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // ✅ Handle Password (Google signup won’t have one)
      let hashedPassword = null;
      if (!isGoogleSignup && Password) {
        hashedPassword = await bcrypt.hash(Password, 10);
      }

      // ✅ File uploads
      const ProductUrls =
        req.files["productImages"]?.map((file) => file.path) || [];
      const Profile_Image = req.files["profileImage"]?.[0]?.path || "";

      // ✅ Save vendor into TempVendor
      const vendor = new TempVendor({
        Business_Name,
        Owner_name,
        Email_address,
        Phone_number,
        Business_address,
        Category,
        Sub_Category: Array.isArray(Sub_Category)
          ? Sub_Category
          : [Sub_Category],
        Tax_ID,
        Password: hashedPassword, // null for Google signup
        Latitude,
        Longitude,
        ProductUrls,
        Profile_Image,
        ID_Type,
        Account_Number,
        IFSC_Code,
        Charge_Type,
        Charge_Per_Hour_or_Day,
        description,
        isGoogleSignup: isGoogleSignup || false, // 👈 store flag
      });

      await vendor.save();

      
      try {
        const subject = "Thanks For Register";
        const htmlContents = `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"><title>Welcome to Apna Mestri</title></head>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
      <h2 style="color: #333;">Welcome to Apna Mestri!</h2>
      <p style="font-size: 16px; color: #555;">
        Hello ${Owner_name},<br><br>
        Thank you for registering with <strong>Apna Mestri</strong>.  
        Your account has been successfully created.
      </p>
      <p style="font-size: 16px; color: #555;">
        You can now log in and start adding your services/products.
      </p>
      <div style="margin: 20px 0;">
        <a href="https://apna-mestri-vendor.vercel.app/login" 
           style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
           Go to Vendor Login
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you have any questions, feel free to reach out to our support team.<br><br>
        – The Apna Mestri Team
      </p>
    </div>
  </body>
</html>`;
        await register(Email_address, Owner_name, htmlContents, subject);
      } catch (mailErr) {
        console.error("Email sending failed:", mailErr);
      }

      res.json({ message: "Registration successful" });
    } catch (err) {
      console.error("Error during registration:", err);
      res.status(500).json({ error: "Server error during registration" });
    }
  }
);


app.get("/api/projects/:vendorId", async (req, res) => {
  try {
    const projects = await projectupload.find({ VendorID: req.params.vendorId })
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "❌ Server error" });
  }
});
app.post("/projecteatils/vendor", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, vendorId } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "Image upload failed" });
    }

    const project = new projectupload({
      VendorID: vendorId,  
      title,
      description,
      category,
      image: req.file.path, 
    });

    await project.save();
    res.status(201).json({ message: " Project uploaded successfully", project });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.put(
  "/update/userdetailes/:id",
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "profileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userid = req.params.id;

      // All fields from registration - add missing ones as needed!
      let {
        Business_Name,
        Owner_name,
        Email_address,
        Phone_number,
        Business_address,
        Category,
        Sub_Category,
        Tax_ID,
        Password,
        Latitude,
        Longitude,
        ID_Type,
        Account_Number,
        IFSC_Code,
        Charge_Type,
        Charge_Per_Hour_or_Day,
        description,
        isGoogleSignup
      } = req.body;

      // Handle files
      let ProductUrls = [];
      let Profile_Image = "";

      // Upload product images to Cloudinary if present
      if (req.files && req.files["productImages"]) {
        for (const file of req.files["productImages"]) {
          const result = await cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (result && result.secure_url) {
                ProductUrls.push(result.secure_url);
              }
            }
          ).end(file.buffer);
        }
      }

      // Upload profile image to Cloudinary if present
      if (req.files && req.files["profileImage"] && req.files["profileImage"][0]) {
        const file = req.files["profileImage"][0];
        await cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (result && result.secure_url) {
              Profile_Image = result.secure_url;
            }
          }
        ).end(file.buffer);
      }

      // Hash password (only if changed/present – backend can check old hash to avoid re-hashing)
      let hashedPassword = undefined;
      if (Password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(Password, saltRounds);
      }

      // Fix subcategory input (allow array/string from client)
      if (Sub_Category && typeof Sub_Category === "string") {
        Sub_Category = Sub_Category.split(",").map(s => s.trim());
      }

      // Update vendor fields; build only changed fields
      const updatedFields = {
        Business_Name,
        Owner_name,
        Email_address,
        Phone_number,
        Business_address,
        Category,
        Sub_Category,
        Tax_ID,
        Latitude,
        Longitude,
        ID_Type,
        Account_Number,
        IFSC_Code,
        Charge_Type,
        Charge_Per_Hour_or_Day,
        description,
        ProductUrls,           // array of images from Cloudinary
        Profile_Image,         // profile photo URL
        isGoogleSignup
      };
      if (hashedPassword) updatedFields.Password = hashedPassword;

      // Remove empty fields (allows patch-like update)
      Object.keys(updatedFields).forEach(
        key => updatedFields[key] === undefined && delete updatedFields[key]
      );

      const updatedVendor = await Vendor.findByIdAndUpdate(
        userid,
        updatedFields,
        { new: true }
      );

      res.status(200).json({ message: "User updated", data: updatedVendor });
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ message: "Update failed", error: err });
    }
  }
);

app.post('/google-login', async (req, res) => {
  const { email, name } = req.body;

  try {
    // Try to find vendor by email
    const vendor = await Vendor.findOne({ Email_address: email });
    const tempVendor = await TempVendor.findOne({ Email_address: email });

    if (vendor) {
      // Vendor found and verified? Return success
      if (vendor) {
        return res.json({ message: 'Success', vendorId: vendor._id });
      } else {
        return res.json({ message: 'User pending approval' });
      }
    } else if (tempVendor) {
      return res.json({ message: 'User pending approval' });
    } else {
      // Optionally auto-register new Google user here or ask front end to redirect to sign up
      // For auto-register example:
      const newVendor = new TempVendor({
        Owner_name: name,
        Email_address: email,
        isGoogleSignup: true,
      });
      await newVendor.save();
      return res.json({ message: 'User pending approval' });
    }
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Server error during Google login' });
  }
});

app.post("/loginwith-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const vendor = await Vendor.findOne({ Email_address: email });
    if (!vendor) {
      return res.json({ message: "User not found" });
    }

    return res.json({ message: "Success", vendorId: vendor._id });
  } catch (err) {
    console.error("Login with OTP error:", err);
    return res.status(500).json({ message: "Server error during login with OTP" });
  }
});

app.post("/checktempvendor", async (req, res) => {
  const { Email_address } = req.body;
  try {
    const found = await TempVendor.findOne({ Email_address });
    return res.json({ found: !!found });
  } catch (err) {
    console.error("TempVendor check error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



app.post("/add_vendor", async (req, res) => {
  try {
    const {
      Business_Name,
      Owner_name,
      Email_address,
      Phone_number,
      Business_address,
      Category,
      Sub_Category,
      Tax_ID,
      Password,
      Latitude,
      Longitude,
      ProductUrl,
    } = req.body;

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    const vendors = {
      Business_Name,
      Owner_name,
      Email_address,
      Phone_number,
      Business_address,
      Category,
      Sub_Category,
      Tax_ID,
      Password: hashedPassword, // Save hashed password
      Latitude,
      Longitude,
      ProductUrl,
    };

    const data = await Vendor.create(vendors);
    console.log("Vendor added:", data);
    res.status(200).json({ message: "Vendor added successfully", data });
  } catch (err) {
    console.error("Error adding vendor:", err);
    res.status(500).json({ error: "Failed to add vendor", details: err.message });
  }
});

app.post("/postusername", async (req, res) => {
  const { username, password } = req.body;

  try {
    const lgin = await Vendor.findOne({ Email_address: username });

    if (!lgin) {
      return res.json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, lgin.Password);

    if (passwordMatch) {
      return res.json({ message: "Success", vendorId: lgin._id });
    } else {
      return res.json({ message: "Invalid password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/vendor/count", async (req, res) => {
  try {
    const count = await Vendor.countDocuments();
    const count1 = await productdata.countDocuments();

    res.json({ count, count1 });
  } catch (err) {
    console.log("error Fetching", err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/dashboard/recent",async(req,res)=>{
  try{
  const date=new Date()
  date.setDate(date.getDate()-7);
  const result=await vieworder.find({orderedAt:{$gte:date}})
  res.json(result)
  }
  catch(err){
    console.log(err)
  }

})

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
app.get("/fetch/review/service/:rid",async(req,res)=>{
  try{
  const rid=req.params.rid;
  const getreview=await revieworder.find({vendorids:rid})
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
      vendorids,
      rating,
      comment
    } = req.body;

    const revieorders = new revieworder({
      productId,
      vid, 
      customerName,
      rating,
      vendorids,
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
      discountedprice
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
      ProductUrl: ProductUrls, 
      discountedprice
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ message: "Product uploaded successfully", product: savedProduct });

  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/profiledata", async (req, res) => {
  const {
    Full_Name,
    Emailaddress,
    Phone_Number,
    Password,
    Location
  } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    const dataprofile = {
      Full_Name,
      Emailaddress,
      Phone_Number,
      Password: hashedPassword, // store hashed password
      Location
    };

    const data = await UserMain.create(dataprofile);
    console.log("Response saved successfully", data);
    res.status(201).json({ message: "Profile saved successfully", data });
    try{
      const subject="Thanks For Register"
      const htmlContents=`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" 
         style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td align="center" style="padding: 20px; background-color: #004aad;">
        <!-- CHANGE LOGO HERE -->
        <img src="https://res.cloudinary.com/dqxsgmf33/image/upload/v1755801310/Changed_logo_dfshkt.png" alt="Apna Mestri Logo" width="150" style="display:block;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color:#333;">Welcome to Apna Mestri!</h2>
        <p style="color:#555; font-size: 16px; line-height: 24px;">
          Thank you for registering as a customer. You can now explore our services and book professionals easily.
        </p>
        <p style="text-align: center; margin-top: 20px;">
          <a href="https://apnamestri.com/login" 
             style="background-color: #004aad; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Get Started
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="background-color:#f0f0f0; padding: 15px; color:#777; font-size: 14px;">
        © 2025 Apna Mestri. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>

`
      
await register(Emailaddress,Full_Name,htmlContents,subject)
    }
    catch(err){
      console.log("Failed to send email",err)
    }
  } catch (err) {
    console.error("Failed to save data:", err);
    res.status(500).json({ error: "Failed to save profile data" });
  }
});

app.post("/fetch/userprofile", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserMain.findOne({ Emailaddress: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.Password);

    if (isPasswordMatch) {
      return res.status(200).json({
        message: "Success",
        user,
        userId: user._id
      });
    } else {
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Approve vendor and move from temp collection to main collection
app.post("/postdatabase/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // 1️⃣ Find vendor in the temporary collection
    const vendor = await TempVendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found in temporary collection" });
    }

    // 2️⃣ Prepare data for the final Vendor collection
    const newVendorData = {
      Business_Name: vendor.Business_Name,
      Owner_name: vendor.Owner_name,
      Email_address: vendor.Email_address,
      Phone_number: vendor.Phone_number,
      Business_address: vendor.Business_address,
      Category: vendor.Category,
      Sub_Category: Array.isArray(vendor.Sub_Category)
        ? vendor.Sub_Category
        : vendor.Sub_Category
        ? [vendor.Sub_Category]
        : [],
      Tax_ID: vendor.Tax_ID,
      Password: vendor.Password,
      ID_Type: vendor.ID_Type,
      ProductUrls: Array.isArray(vendor.ProductUrls)
        ? vendor.ProductUrls
        : vendor.ProductUrls
        ? [vendor.ProductUrls]
        : [],
      Profile_Image: vendor.Profile_Image || "",
      Latitude: vendor.Latitude,
      Longitude: vendor.Longitude,
      registrationDate: vendor.registrationDate || new Date(),
      Account_Number: vendor.Account_Number || "",
      IFSC_Code: vendor.IFSC_Code || "",
      Charge_Per_Hour_or_Day: vendor.Charge_Per_Hour_or_Day || "",
      Charge_Type: vendor.Charge_Type || "",
      description:vendor.description
    };

    // 3️⃣ Save to final collection
    const finalVendor = new Vendor(newVendorData);
    await finalVendor.save();

    // 4️⃣ Remove from temporary collection
    await TempVendor.findByIdAndDelete(id);

    res.json({ message: "Vendor approved and moved successfully", vendor: finalVendor });
  } catch (err) {
    console.error("Error posting vendor:", err);
    res.status(500).json({ error: "Server error while posting vendor" });
  }
});
app.post("/api/viewstore", async(req,res)=>{
  try{
    const {id} = req.body;
    const product_id=await productdata.find({Vendor:id})
    res.json(product_id)
  
  }
  catch(err){
    res.json(err)
    console.log(err)
  }
})
app.post("/login-with-otp", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserMain.findOne({ Emailaddress: email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // No password check here — trust OTP verification was done before
        return res.status(200).json({
            message: "Success",
            user,
            userId: user._id
        });
    } catch (err) {
        console.error("Error logging in with OTP:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
app.get("/profesionaldetails/:id",async(req,res)=>{
  try{
    const ids=req.params.id
    if(ids){
    const find_details=await Vendor.findById(ids)
    res.json(find_details)
    }
    else{
      console.log("please provide the id to fetch the user profile")
    
    }
    

  }
  catch(err){
    res.json(err)
      
    }
})

app.get("/wow/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await vieworder.countDocuments({ vendorid: id });
    const all = await vieworder.find({ vendorid: id })
      .sort({ orderedAt: -1 }) 
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

      // Geospatial query with Sub_Category array
      services = await Vendor.find({
        Sub_Category: { $in: [new RegExp(category.trim(), "i")] }, // FIX
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
          Sub_Category: { $in: [new RegExp(category.trim(), "i")] } // FIX
        }).limit(10);
      }
    } else {
      services = await Vendor.find({
        Sub_Category: { $in: [new RegExp(category.trim(), "i")] } // FIX
      });
    }

    res.json({
      services,
      description: "Find skilled professionals near you.",
      tags: [category, "services", "local"]
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// GET /api/vendor/:vendorId/price
app.get("/api/vendor/:vendorId/price", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({ vendorPrice: vendor.Charge_Per_Hour_or_Day });
  } catch (err) {
    console.error("Error fetching vendor price:", err);
    res.status(500).json({ error: "Failed to fetch vendor price" });
  }
});


app.get("/fetch/location/booking/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const booking_find = await booking_service.findOne({ customerid: id }).sort({ createdAt: -1 }); 

    if (!booking_find) return res.status(404).json({ message: "No booking found" });

    res.json({
      address: booking_find.address,
      customer: booking_find.customer
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booking", details: err.message });
  }
});

app.post("/api/booking", async (req, res) => {
  try {
    const booking = new booking_service(req.body);

    const { Vendorid, serviceDate, serviceTime, customer } = req.body;
    const { email, fullName } = customer;  // ✅ extract from customer

    const idfind = await Vendor.findById(Vendorid);
    const vendorprice= idfind.Charge_Per_Hour_or_Day
    if (!idfind) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendoremail = idfind.Email_address;
    const vendorname = idfind.Owner_name;

    await booking.save();


    try {
      const subject = "Your Booking Successfully Placed";
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Apna Mestri</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0;">
  <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #007bff; color: #ffffff; border-radius: 8px 8px 0 0;">
        <h1>Apna Mestri</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <h2 style="color: #333;">Booking Confirmed 🎉</h2>
        <p style="color: #555;">Hello <strong>${fullName}</strong>,</p>
        <p style="color: #555;">Thank you for booking a vendor with <strong>Apna Mestri</strong>. Your request has been successfully placed.</p>
        <p style="color: #555;">Here are your booking details:</p>
        <ul style="color: #555;">
          <li><strong>Vendor Name:</strong> ${vendorname}</li>
          <li><strong>Date & Time:</strong> ${serviceDate} at ${serviceTime}</li>
        </ul>
        <p style="color: #555;">Our vendor will reach out to you shortly to confirm further details.</p>
        <p style="margin-top: 20px; text-align: center;">
          <a href="https://apnamestri.com" style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Booking</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 15px; text-align: center; background-color: #f1f1f1; color: #777; border-radius: 0 0 8px 8px;">
        <p>Thank you for choosing <strong>Apna Mestri</strong>.<br>We make services easier for you!</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // ✅ Send to customer
      await register(email, fullName, htmlContent, subject);

      // ✅ Also notify vendor (optional)
      const vendorSubject = "New Booking Alert";
      const vendorContent = `
        <h3>Hello ${vendorname},</h3>
        <p>You have received a new booking from <b>${fullName}</b> on Apna Mestri.</p>
        <p><b>Date & Time:</b> ${serviceDate} at ${serviceTime}</p>
        <p>Please login to your dashboard for details.</p>
      `;
      await register(vendoremail, vendorname, vendorContent, vendorSubject);

    } catch (err) {
      console.log("Failed to send email", err);
    }

    res.status(200).json({ message: "Booking saved successfully", booking ,vendorprice});
  } catch (err) {
    console.error("Booking Save Error:", err);
    res.status(500).json({ error: "Failed to save booking" });
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


app.get("/upcomingjobs/:id", async (req, res) => {
  try {
    const vendorId = req.params.id;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const threeDaysLater = new Date();
threeDaysLater.setDate(today.getDate() + 3);
const endOfDay = new Date(threeDaysLater.setHours(23, 59, 59, 999));

    const upcomingJobs = await booking_service.find({
      Vendorid: vendorId,
      serviceDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('Vendorid')
    .populate('customerid')
    .sort({ serviceTime: 1 }); 
    res.status(200).json(upcomingJobs);
  } catch (err) {
    console.error("Error fetching today's jobs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.listen(8031, () => {
  console.log("Server started on http://localhost:8031");
});
