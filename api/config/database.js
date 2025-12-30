const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.mongoURI_perment;

    if (!mongoURI) {
      console.error('❌ MongoDB URI is not defined in environment variables (mongoURI_perment)');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    if (err.name === 'MongooseServerSelectionError') {
      console.error('\n⚠️  TIP: This error usually means your IP address is not whitelisted in MongoDB Atlas.');
      console.error('1. Log in to MongoDB Atlas');
      console.error('2. Go to "Network Access"');
      console.error('3. Add your current IP address (or 0.0.0.0/0 for testing)\n');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
