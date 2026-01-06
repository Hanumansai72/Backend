const userprofile = require("mongoose");
const userprofiledata = userprofile.Schema({
    Full_Name: String,
    Emailaddress: { type: String, unique: true, required: true },
    Phone_Number: { type: String, unique: true, sparse: true },
    Password: String,
    Location: String
}, { collection: "UserProfile" });
const profile = userprofile.model("userdata", userprofiledata)
module.exports = profile
