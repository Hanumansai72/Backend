const database=require("mongoose");
const data=database.Schema({
  Business_Name: String,
  Owner_name: String,
  Email_address: String,
  Phone_number: String,
  Business_address: String,
  Category: String,
  Sub_Category: String,
  Tax_ID: String,
  registrationDate: {
    type: Date,
    default: Date.now  // Automatically stores current timestamp
  },
  Password:String

},{collection:"Temp-reg"});
const temp_register=database.model("tempo",data)
module.exports=temp_register;