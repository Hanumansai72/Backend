const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://hanumansai72:PHxojTiAxGCBVXbJ@cluster0.lfuudui.mongodb.net/apana_mestri?retryWrites=true&w=majority&appName=Cluster0"
      ,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Database Connected");
  } catch (err) {
    console.log("❌ Failed to connect database", err);
  }
};

module.exports = connectDB;
