const express = require('express');
const router = express.Router();
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  getTeamStats
} = require('../controllers/teamController');

// Create team
router.post('/', createTeam);

// Get all teams
router.get('/get-all-teams', getAllTeams);

// Get team by ID
router.get('/get-team-by-id/:id', getTeamById);

// Update team
router.put('/update-team/:id', updateTeam);

// Get team statistics
router.get('/stats', getTeamStats);

module.exports = router; 
