const SibApiV3Sdk = require('@getbrevo/brevo');

// Initialize Brevo API client
const initApiInstance = () => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  console.log('Brevo API Key configured:', process.env.BREVO_API_KEY ? 'SET' : 'NOT SET');
  return apiInstance;
};

/**
 * Send a generic email using Brevo API
 */
const sendEmail = async (email, name, htmlContents, subject) => {
  const apiInstance = initApiInstance();

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContents;
  sendSmtpEmail.sender = { name: 'Apna Mestri', email: 'help@apnamestri.com' };
  sendSmtpEmail.to = [{ email: email, name: name || 'Customer' }];

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo API Email sent:', result);
    return result;
  } catch (error) {
    console.error('Brevo API Error:', error.response?.body || error.message);
    throw error;
  }
};


const sendOTP = async (email, otp) => {
  s
  const apiInstance = initApiInstance();

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

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = 'Your OTP Code - Apna Mestri';
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: 'Apna Mestri', email: 'help@apnamestri.com' };
  sendSmtpEmail.to = [{ email: email }];

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo API OTP sent to:', email, 'MessageId:', result?.messageId);
    return result;
  } catch (error) {
    console.error('Brevo API OTP Error:', {
      status: error.response?.status,
      body: error.response?.body,
      message: error.message
    });
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendOTP
};
