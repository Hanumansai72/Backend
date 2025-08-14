const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    Email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    Otp: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300
    }
});

const OtpModel = mongoose.model("Otp", otpSchema);

module.exports = OtpModel;
