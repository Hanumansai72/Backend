const nodemailer = require("nodemailer");

async function sendTestEmail() {
  const otpCode = Math.floor(100000 + Math.random() * 900000);

  const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "94b255001@smtp-brevo.com", // the Login shown in your SMTP settings
    pass: "JPHqgGOcYjv8CN04", // Master Password from SMTP settings
  }
});

  const mailOptions = {
    from: "help@apnamestri.com",
    to: "@gmail.com",
    subject: "Test OTP Email",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>OTP Verification - Apna Mestri</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="background: #f2f2f2; display: inline-block; padding: 10px 20px; color: #000; border-radius: 5px;">${otpCode}</h1>
        <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      </div>
    `
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
}

sendTestEmail();
