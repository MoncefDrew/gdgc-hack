const nodemailer = require('nodemailer');

// Create a test transporter (for development)
const createDevTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'joaquin.predovic@ethereal.email',
      pass: process.env.EMAIL_PASS || 'zkBRB7aUK7SF72umnC'
    }
  });
};

// Create a production transporter
const createProdTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Get the appropriate transporter based on environment
const getTransporter = () => {
  console.log('Initializing email transporter');
  if (process.env.NODE_ENV === 'production') {
    return createProdTransporter();
  }
  return createDevTransporter();
};

// Send verification email
const sendVerificationEmail = async (email, token, fullName) => {
  const transporter = getTransporter();
  
  // Construct verification URL
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const verificationURL = `${baseURL}/api/participants/verify-email/${token}`;
  
  console.log('Sending verification email to:', email);
  console.log('Verification URL:', verificationURL);
  
  // Email content
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'hope.windler@ethereal.email',
    to: email,
    subject: 'Hackathon Registration: Email Verification',
    html: `
      <h1>Email Verification</h1>
      <p>Hello ${fullName},</p>
      <p>Thank you for registering for our hackathon! Please verify your email by clicking the link below:</p>
      <p><a href="${verificationURL}">Verify your email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for this event, please ignore this email.</p>
    `
  };
  
  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    
    // For development - log email preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send reset password email
const sendResetPasswordEmail = async (email, resetLink, htmlContent) => {
  const transporter = getTransporter(); // <== Add this line!
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("----------------------");

    console.log('Reset email sent:', info.messageId);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};


module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail
};