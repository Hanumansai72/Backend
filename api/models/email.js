const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hanumansai40@gmail.com',        
    pass: 'dzpihdrkfhtgqpkr', 
  },
});

const mailOptions = {
  from: 'hanumansai40@gmail.com',         
  to: 'hanumansai41@gmail.com',           
  subject: 'Hello from Node.js!',        
  text: 'This is a plain text email!',   
  html: '<h2>This is an HTML email</h2><p>Sent using <b>Node.js</b> and <i>nodemailer</i>.</p>', // HTML body
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});
