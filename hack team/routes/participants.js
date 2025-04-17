const express = require('express');
const router = express.Router();
const { 
  createParticipant, 
  verifyEmail, 
  resendVerificationEmail, 
  getAllParticipants, 
  getParticipantById, 
  updateParticipant 
} = require('../controllers/participantController');
const { 
  checkTeamCapacity, 
  checkTeamChangeCapacity 
} = require('../middleware/teamValidation');

// Create participant
router.post('/register', checkTeamCapacity, createParticipant);

// Verify email
router.get('/verify-email/:token', verifyEmail);

// Resend verification email
router.post('/resend-verification-email/:id', resendVerificationEmail);

// Get all participants
router.get('/get-all-participants', getAllParticipants);

// Get participant by ID
router.get('/get-participant-by-id/:id', getParticipantById);

// Update participant
router.put('/update-participant/:id', checkTeamChangeCapacity, updateParticipant);

module.exports = router;
