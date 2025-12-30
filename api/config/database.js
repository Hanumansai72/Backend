const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.mongoURI_perment;

    if (!mongoURI) {
      console.error('❌ MongoDB URI is not defined in environment variables (mongoURI_perment)');
      return; // Don't exit yet, let initializeApp try to handle it or show error
    }

    const maskedUri = mongoURI.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Attempting to connect to: ${maskedUri}`);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log("✅ Database Connected");
  } catch (err) {
    console.error("❌ Failed to connect database:", err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('TIP: Verify your internet connection and MongoDB Atlas whitelist (0.0.0.0/0 is set, but maybe port 27017 is blocked).');
    }
  }
};

module.exports = connectDB;
