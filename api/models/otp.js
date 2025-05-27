const twilio = require('twilio');

const accountSid = 'AC55d3a81d0f846d0ed8bfdc78c0faa1f6';
const authToken = '8f2dbcaa7c6e68c91fb20b11770b1339';
const client = new twilio(accountSid, authToken);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const sendOTP = async (phoneNumber) => {
  const otp = generateOTP();

  try {
    const message = await client.messages.create({
      body:`Apna Mestri Your OTP is: ${otp}. Please do not share this with anyone. It expires in 5 minutes.`,
      to: phoneNumber,
      from: '+18595454306',
    });

    console.log(`OTP sent successfully: ${otp}`);
    console.log(`Message SID: ${message.sid}`);
  } catch (error) {
    console.error('Error sending OTP:', error.message);
  }
};

sendOTP('+917995853413');
