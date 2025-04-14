const database=require("mongoose");

const Scheme=new database.Scheme({
    Email:String,
    Password:String
});
const admin=database.model("apana_mestri",Scheme);
module.exports=admin;