require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to match your SMTP provider
  auth: {
    user: process.env.EMAIL_USER || 'your.email@gmail.com', // Need to set these in .env
    pass: process.env.EMAIL_PASS || 'your_app_password'
  }
});

const sendEmail = async (to, subject, html, replyTo = null, senderName = null) => {
  try {
    const fromName = senderName ? `${senderName} (via BoostMe)` : 'BoostMe System';
    const mailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER || 'your.email@gmail.com'}>`,
      to,
      subject,
      html
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;
