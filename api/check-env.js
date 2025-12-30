const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('--- Environment Check ---');
console.log('Current __dirname:', __dirname);
console.log('Target .env path:', path.join(__dirname, '../.env'));
console.log('.env file exists:', fs.existsSync(path.join(__dirname, '../.env')));

if (process.env.mongoURI_perment) {
    const uri = process.env.mongoURI_perment;
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('mongoURI_perment is set:', maskedUri);
} else {
    console.log('mongoURI_perment is NOT set!');
}

console.log('-------------------------');
process.exit(0);
