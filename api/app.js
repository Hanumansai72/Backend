const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// Replace <db_password> with your actual password
const mongoURI = "mongodb+srv://hanumansai72:PHxojTiAxGCBVXbJ@cluster0.lfuudui.mongodb.net/apana_mestri?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB Atlas
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Schema for Admin Login
const AdminLogin = mongoose.model("AdminLogin", new mongoose.Schema({
  login: {
    id: String,
    email: String,
    password: String
  }
}), "Admin-Login");

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login:", email, password);

  try {
    const user = await AdminLogin.findOne({ "login.email": email });

    if (user) {
      if (user.login.password === password) {
        res.json("Success");
      } else {
        res.json("Invalid password");
      }
    } else {
      res.json("User not found");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json("Server error");
  }
});

// Start server
app.listen(8031, () => {
  console.log("Server started on http://localhost:8031");
});
