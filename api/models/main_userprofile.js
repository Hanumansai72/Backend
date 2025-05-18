const userprofile=require("mongoose");
const userprofiledata=userprofile.Schema({
    Full_Name:String,
    Emailaddress:String,
    Phone_Number:String,
    Password:String,
    Location:String
},{collection:"UserProfile"});
const profile=userprofile.model("userdata",userprofiledata)
module.exports=profile