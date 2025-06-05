const nodemailer = require('nodemailer');

function nodemailers(email, subject, htmlcontent) {
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net', // Correct GoDaddy SMTP host
    port: 465,                         // SSL port for secure connection
    secure: true,                      // true for port 465
    auth: {
      user: 'help@apnamestri.com',
      pass: 'Hanumansai41#', // Replace with secure env variable in production
    },
  });

  const mailOptions = {
    from: 'help@apnamestri.com',
    to: email,
    subject: subject,
    html: htmlcontent,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', info.response);
    }
  });
}

nodemailers("hanumansai41@gmail.com", "It’s working", "<h1>Hi</h1>");
