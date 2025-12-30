const mongoose = require("mongoose");

// Disable buffering so we get immediate errors instead of 10s timeouts
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const mongoURI = process.env.mongoURI_perment;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables (mongoURI_perment)');
    }

    const maskedUri = mongoURI.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Attempting to connect to: ${maskedUri}`);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      connectTimeoutMS: 10000,
    });

    console.log("✅ Database Connected");
  } catch (err) {
    console.error("❌ Failed to connect database:", err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('TIP: This is a network/whitelist issue. Ensure your Atlas cluster is active and 0.0.0.0/0 is permitted.');
    }
    // Re-throw so the app doesn't start if DB is down
    throw err;
  }
};

module.exports = connectDB;
