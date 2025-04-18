const Admin = require("../models/Admin");
const Participant = require("../models/Participant");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const Team = require('../models/Team'); // adjust path based on your project structure

const { sendResetPasswordEmail } = require("../utils/emailService"); // Import email service

/**
 * @desc    Create a new admin account
 * @route   POST /api/admin/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Admin signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    login with admin
 * @route   POST /api/admin/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Sends reset password Link
 * @route   POST /api/admin/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Generate a temporary token (valid for 15 mins)
    const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Construct the reset password link
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send the reset password email
    const html = `
        <p>Hello ${admin.name || "Admin"},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `;

    // Send email via your email service
    const emailSent = await sendResetPasswordEmail(
      admin.email,
      resetLink,
      html
    );

    if (emailSent) {
      res
        .status(200)
        .json({ message: "Reset password link sent to your email" });
    } else {
      res.status(500).json({ message: "Failed to send reset password email" });
    }
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Reset the Password
 * @route   POST /api/admin/resetPassword
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ message: "Invalid or expired token" });
  }
};


/**
 * @desc    check in the participant
 * @route   POST /api/admin/check-in
 * @access  Public
 */
const checkIn = async (req, res) => {
  try {
    const { email, qrCode } = req.body;

    // Find participant by email or QR code
    const participant = await Participant.findOne({
      $or: [{ email }, { qrCode }],
    });

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Update attendance status
    participant.attendanceStatus = "Attended";
    await participant.save();

    return res
      .status(200)
      .json({ message: "Participant checked in", participant });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};


/**
 * @desc    Get all checked-in participants
 * @route   GET /api/admin/check-ins
 * @access  Private (Admin)
 */
const getAllCheckIns = async (req, res) => {
  try {
    const checkedInParticipants = await Participant.find({ attendanceStatus: 'Attended' });

    return res.status(200).json({
      message: 'Checked-in participants retrieved successfully',
      count: checkedInParticipants.length,
      participants: checkedInParticipants,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/**
 * @desc    send acceptance email to the participants
 * @route   GET /api/admin/send-acceptance-email
 * @access  Private (Admin)
 */
const sendAcceptanceEmail = async (req, res, next) => {
  try {
    // 1. Find accepted teams
    const acceptedTeams = await Team.find({ status: "Accepted" }).populate("participants");

    if (acceptedTeams.length === 0) {
      return res.status(404).json({ message: "No accepted teams found." });
    }

    // 2. Extract all participants from accepted teams
    const acceptedParticipants = acceptedTeams.flatMap(team => team.participants);

    if (acceptedParticipants.length === 0) {
      return res.status(404).json({ message: "No participants found in accepted teams." });
    }

    // 3. Setup email transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    

    // 4. Loop through participants
    for (const participant of acceptedParticipants) {
      const qrCodeData = await QRCode.toDataURL(participant.email); // You can use participant._id instead

      const mailOptions = {
        from: '"Hackathon Team" <your@email.com>',
        to: participant.email,
        subject: "🎉 You've been accepted to the Hackathon!",
        html: `
          <p>Hi ${participant.fullName || participant.email},</p>
          <p>Congratulations! You've been <strong>accepted</strong> to participate in our Hackathon 🎉</p>
          <p>Please present the QR code below at check-in:</p>
          <img src="${qrCodeData}" alt="QR Code" />
          <p>We can't wait to see you there!</p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: "Acceptance emails sent successfully." });
  } catch (error) {
    console.error("Error sending emails:", error.message);
    res.status(500).json({ message: "Failed to send emails", error: error.message });
  }
};

/**
 * @desc    Send waitlist notification emails to unaccepted participants
 * @route   POST /api/admin/send-waitlist-notification
 * @access  Private (Admin)
 */
const sendWaitlistNotification = async (req, res, next) => {
  try {
    // 1. Find teams that are not accepted (those with status not equal to "Accepted")
    const nonAcceptedTeams = await Team.find({ status: { $ne: "Accepted" } }).populate("participants");

    if (nonAcceptedTeams.length === 0) {
      return res.status(404).json({ message: "No waitlisted teams found." });
    }

    // 2. Extract all participants from non-accepted teams
    const waitlistedParticipants = nonAcceptedTeams.flatMap(team => team.participants);

    if (waitlistedParticipants.length === 0) {
      return res.status(404).json({ message: "No participants found in waitlisted teams." });
    }

    // 3. Setup email transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // 4. Loop through participants and send waitlist emails
    for (const participant of waitlistedParticipants) {
      const mailOptions = {
        from: '"Hackathon Team" <your@email.com>',
        to: participant.email,
        subject: "Hackathon Registration Update - Waitlist Status",
        html: `
          <p>Hi ${participant.fullName || participant.email},</p>
          <p>Thank you for your interest in our Hackathon!</p>
          <p>We received an overwhelming number of applications this year, and while your application was impressive, 
          we are currently at capacity. <strong>Your application has been placed on our waitlist.</strong></p>
          <p>If a spot becomes available, we will contact you immediately. We appreciate your understanding and hope
          to be able to welcome you to the event.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br/>The Hackathon Team</p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ 
      success: true,
      message: "Waitlist notification emails sent successfully.",
      count: waitlistedParticipants.length
    });
  } catch (error) {
    console.error("Error sending waitlist emails:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to send waitlist emails", 
      error: error.message 
    });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getAllCheckIns,
  checkIn,
  sendAcceptanceEmail,
  sendWaitlistNotification,
};