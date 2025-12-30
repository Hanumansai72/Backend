const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    Email: {
        type: String,
        required: true
    },
    Otp: {
        type: Number,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - MongoDB will auto-delete expired documents
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("OTP", otpSchema);
