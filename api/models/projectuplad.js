const mongoose = require("mongoose");
const Vendors=require("./admin")


const ProjectSchema = new mongoose.Schema(
  {
    VendorID:{
    type: mongoose.Schema.Types.ObjectId,
    ref:Vendors,
    required: true

        

    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000, // 200 words approx
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Web Development",
        "Mobile App",
        "UI/UX Design",
        "Marketing",
        "Other",
      ],
    },
    image: {
      type: String, // URL (Cloudinary, S3, or local storage path)
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
