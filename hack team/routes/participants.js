const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Team = require('../models/Team');

// Create a new participant
router.post('/', async (req, res, next) => {
  try {
    console.log('Creating new participant:', req.body);
    
    // Create the participant
    const participant = await Participant.create(req.body);
    console.log('Participant created:', participant);
    
    // Check if team exists with the given team name
    const teamName = req.body.teamName;
    console.log('Looking for team with name:', teamName);
    
    let team = await Team.findOne({ name: teamName });
    
    if (team) {
      console.log('Team found, adding participant to existing team');
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
      data: participant
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

// Get all participants
router.get('/', async (req, res, next) => {
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
router.get('/:id', async (req, res, next) => {
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
router.put('/:id', async (req, res, next) => {
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