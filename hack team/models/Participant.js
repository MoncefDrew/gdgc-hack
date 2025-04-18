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
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  }
  
}, {
  timestamps: true
});


participantSchema.methods.generateVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.verificationToken = verificationToken;
  this.verificationTokenExpires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours

  return verificationToken;
};


module.exports = mongoose.model('Participant', participantSchema); 