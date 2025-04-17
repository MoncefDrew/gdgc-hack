const Admin = require("../models/Admin");
const Participant = require("../models/Participant");
const Team = require("../models/Team")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
 * @desc    Get Teams (with pagination parameters)
 * @route   POST /api/admin/teams
 * @access  Public
 */
const getTeams = async (req, res) => {
  try {
    const { status } = req.query;

    // Optional status filter, case-insensitive
    const filter = {};
    if (status) {
      const validStatuses = ['Pending', 'Accepted', 'Rejected'];
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }

      filter.status = normalizedStatus;
    }

    const teams = await Team.find(filter)
      .populate('participants')
      .sort({ createdAt: -1 }); // newest teams first (optional)

    res.status(200).json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


/**
 * @desc    Get Participants (with pagination parameters)
 * @route   POST /api/admin/participants
 * @access  Public
 */
const getParticipants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const limit = parseInt(req.query.limit) || 5; // Default limit is 5
    const skip = (page - 1) * limit;

    const participants = await Participant.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: newest first

    const total = await Participant.countDocuments();

    res.status(200).json({
      data: participants,
      page,
      totalPages: Math.ceil(total / limit),
      totalParticipants: total,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getTeams,
  getParticipants,
};
