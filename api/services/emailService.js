const transporter = require('../config/email');

/**
 * Send a generic email
 */
const sendEmail = (email, name, htmlContents, subject) => {
    const mailOption = {
        from: '"Apna Mestri" <help@apnamestri.com>',
        to: email,
        subject: subject,
        html: htmlContents,
    };
    return transporter.sendMail(mailOption);
};

/**
 * Send OTP email
 */
const sendOTP = (email, otp) => {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>OTP Verification - Apna Mestri</h2>
      <p>Hello,</p>
      <p>Thank you for registering with <strong>Apna Mestri</strong>.</p>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="background: #f2f2f2; display: inline-block; padding: 10px 20px; color: #000; border-radius: 5px;">
        ${otp}
      </h1>
      <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      <p>Best regards,<br><strong>Apna Mestri Team</strong></p>
    </div>
  `;

    const mailOptions = {
        from: '"Apna Mestri" <help@apnamestri.com>',
        to: email,
        subject: 'Your OTP Code',
        html: htmlContent,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendEmail,
    sendOTP
};
