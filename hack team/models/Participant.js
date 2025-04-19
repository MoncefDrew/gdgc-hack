const mongoose = require('mongoose');
const crypto = require('crypto');

const participantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  wilaya: {
    type: String,
    required: [true, 'Wilaya is required']
  },
  teamName: {
    type: String,
    required: [true, 'Team name is required']
  },
  isTeamLeader: {
    type: Boolean,
    default: false
  },
  teamCode: {
    type: String
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Experience level is required']
  },
  technicalSkills: {
    type: [String],
    default: []
  },
  shirtSize: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    required: [true, 'Shirt size is required']
  },
  linkedinProfile: {
    type: String,
    default: ''
  },
  githubProfile: {
    type: String,
    default: ''
  },
  motivationLetter: {
    type: String,
    default: ''
  },
  heardAboutUs: {
    type: String,
    default: ''
  },
  hackathonExperience: {
    type: String,
    default: ''
  },
  attendanceStatus: {
    type: String,
    enum: ['Absent', 'Attended'],
    default: 'Absent'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date
}, {
  timestamps: true
});

// Method to generate verification token
participantSchema.methods.generateVerificationToken = function() {
  // Generate a random token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  // Set token and expiration
  this.verificationToken = verificationToken;
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to generate a team code for team leaders
participantSchema.methods.generateTeamCode = function() {
  // Generate a 6-character alphanumeric code
  const teamCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  this.teamCode = teamCode;
  return teamCode;
};

module.exports = mongoose.model('Participant', participantSchema); 