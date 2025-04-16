const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Create a new team
router.post('/', async (req, res, next) => {
  try {
    console.log('Creating new team:', req.body);
    const team = await Team.create(req.body);
    console.log('Team created:', team);
    
    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.log('Error creating team:', error.message);
    
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
        error: 'Team name already exists'
      });
    }
    
    next(error);
  }
});

// Get all teams
router.get('/get-all-teams', async (req, res, next) => {
  try {
    console.log('Fetching all teams');
    const teams = await Team.find().populate('participants');
    console.log(`Found ${teams.length} teams`);
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.log('Error fetching teams:', error.message);
    next(error);
  }
});

// Get a single team
router.get('/get-team-by-id/:id', async (req, res, next) => {
  try {
    console.log('Fetching team with ID:', req.params.id);
    const team = await Team.findById(req.params.id).populate('participants');
    
    if (!team) {
      console.log('Team not found');
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    console.log('Team found:', team);
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.log('Error fetching team:', error.message);
    next(error);
  }
});

// Update a team
router.put('/update-team/:id', async (req, res, next) => {
  try {
    console.log('Updating team with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('participants');
    
    if (!team) {
      console.log('Team not found for update');
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    console.log('Team updated:', team);
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.log('Error updating team:', error.message);
    
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
        error: 'Team name already exists'
      });
    }
    
    next(error);
  }
});

module.exports = router; 
