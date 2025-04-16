const database=require("mongoose");
const data=database.Schema({
    fullName: String,
    phoneNumber: Number,
    email: String,
    businessName: String,
    location: String,
    password: String,
    businessCategory: String,
    subCategory: String,
    registrationDate: String // or Date

},{collection:"Temp-reg"});
const temp_register=database.model("tempo",data)
module.exports=temp_register;