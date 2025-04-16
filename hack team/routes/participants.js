const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Team = require('../models/Team');
const { sendVerificationEmail } = require('../utils/emailService');

// Create a new participant
router.post('/register', async (req, res, next) => {
  try {
    console.log('Creating new participant:', req.body);
    
    // Check if team exists with the given team name
    const teamName = req.body.teamName;
    console.log('Looking for team with name:', teamName);
    
    let team = await Team.findOne({ name: teamName });
    
    if (team) {
      console.log('Team found, checking team size');
      // Check if team already has 4 participants
      if (team.participants.length >= 4) {
        console.log('Team already has the maximum number of participants (4)');
        return res.status(400).json({
          success: false,
          error: 'This team already has the maximum number of participants (4)'
        });
      }
      console.log('Team has space for more participants');
    }
    
    // Create the participant
    const participant = await Participant.create(req.body);
    console.log('Participant created:', participant);
    
    // Generate verification token
    const verificationToken = participant.generateVerificationToken();
    await participant.save();
    console.log('Verification token generated:', verificationToken);
    
    // Send verification email
    await sendVerificationEmail(
      participant.email,
      verificationToken,
      participant.fullName
    );
    
    if (team) {
      console.log('Adding participant to existing team');
      // Add participant to existing team
      team.participants.push(participant._id);
      await team.save();
      console.log('Participant added to existing team');
    } else {
      console.log('Team not found, creating new team');
      // Create a new team with this participant
      team = await Team.create({
        name: teamName,
        participants: [participant._id]
      });
      console.log('New team created:', team);
    }
    
    res.status(201).json({
      success: true,
      data: participant,
      message: 'Participant created successfully. Please check your email to verify your account.'
    });
  } catch (error) {
    console.log('Error creating participant:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    next(error);
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const token = req.params.token;
    console.log('Verifying email with token:', token);
    
    // Find participant with the token
    const participant = await Participant.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!participant) {
      console.log('Invalid or expired verification token');
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
    
    // Mark as verified and remove token
    participant.isVerified = true;
    participant.verificationToken = undefined;
    participant.verificationTokenExpires = undefined;
    await participant.save();
    
    console.log('Email verified successfully for:', participant.email);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.log('Error verifying email:', error.message);
    next(error);
  }
});

// Resend verification email
router.post('/resend-verification-email/:id', async (req, res, next) => {
  try {
    const participantId = req.params.id;
    console.log('Resending verification email for participant ID:', participantId);
    
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      console.log('Participant not found');
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    if (participant.isVerified) {
      console.log('Participant already verified');
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }
    
    // Generate new verification token
    const verificationToken = participant.generateVerificationToken();
    await participant.save();
    
    // Send verification email
    await sendVerificationEmail(
      participant.email,
      verificationToken,
      participant.fullName
    );
    
    console.log('Verification email resent to:', participant.email);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.log('Error resending verification email:', error.message);
    next(error);
  }
});

// Get all participants
router.get('/get-all-participants', async (req, res, next) => {
  try {
    console.log('Fetching all participants');
    const participants = await Participant.find();
    console.log(`Found ${participants.length} participants`);
    
    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    console.log('Error fetching participants:', error.message);
    next(error);
  }
});

// Get a single participant
router.get('/get-participant-by-id/:id', async (req, res, next) => {
  try {
    console.log('Fetching participant with ID:', req.params.id);
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      console.log('Participant not found');
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    console.log('Participant found:', participant);
    res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.log('Error fetching participant:', error.message);
    next(error);
  }
});

// Update a participant
router.put('/update-participant/:id', async (req, res, next) => {
  try {
    console.log('Updating participant with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Find the participant before update to get the current team name
    const oldParticipant = await Participant.findById(req.params.id);
    if (!oldParticipant) {
      console.log('Participant not found for update');
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }
    
    // Check if team name is changing and verify new team has space
    if (req.body.teamName && oldParticipant.teamName !== req.body.teamName) {
      console.log('Team name is changing, checking new team capacity');
      
      // Check if new team exists and has capacity
      const newTeam = await Team.findOne({ name: req.body.teamName });
      if (newTeam && newTeam.participants.length >= 4) {
        console.log('New team already has maximum participants (4)');
        return res.status(400).json({
          success: false,
          error: 'The team you are trying to join already has the maximum number of participants (4)'
        });
      }
    }
    
    // Update the participant
    const participant = await Participant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Check if team name changed
    if (req.body.teamName && oldParticipant.teamName !== req.body.teamName) {
      console.log('Team name changed from', oldParticipant.teamName, 'to', req.body.teamName);
      
      // Remove participant from old team
      const oldTeam = await Team.findOne({ name: oldParticipant.teamName });
      if (oldTeam) {
        console.log('Removing participant from old team');
        oldTeam.participants = oldTeam.participants.filter(
          p => p.toString() !== participant._id.toString()
        );
        await oldTeam.save();
        console.log('Participant removed from old team');
      }
      
      // Add participant to new team or create it
      let newTeam = await Team.findOne({ name: req.body.teamName });
      if (newTeam) {
        console.log('Adding participant to existing team');
        if (!newTeam.participants.includes(participant._id)) {
          newTeam.participants.push(participant._id);
          await newTeam.save();
        }
        console.log('Participant added to existing team');
      } else {
        console.log('Creating new team for participant');
        newTeam = await Team.create({
          name: req.body.teamName,
          participants: [participant._id]
        });
        console.log('New team created:', newTeam);
      }
    }
    
    console.log('Participant updated:', participant);
    res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.log('Error updating participant:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    next(error);
  }
});

module.exports = router; 
