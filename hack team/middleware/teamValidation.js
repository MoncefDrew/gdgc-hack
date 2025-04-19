const Team = require('../models/Team');
const Participant = require('../models/Participant');

/**
 * Middleware to check if a team has reached the maximum capacity of 4 participants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const checkTeamCapacity = async (req, res, next) => {
  try {
    // For team leaders creating a new team, we skip the check
    if (req.body.isTeamLeader === true) {
      console.log('Middleware: Team leader registration, skipping capacity check');
      return next();
    }

    // For team members, they must provide a team code
    if (!req.body.teamCode) {
      console.log('Middleware: Team member registration without team code');
      return res.status(400).json({
        success: false,
        error: 'Team code is required for team members'
      });
    }

    console.log('Middleware: Checking team capacity for code', req.body.teamCode);
    const team = await Team.findOne({ teamCode: req.body.teamCode });

    // If team doesn't exist, reject
    if (!team) {
      console.log('Middleware: Invalid team code');
      return res.status(404).json({
        success: false,
        error: 'Invalid team code. Please check with your team leader.'
      });
    }

    // Check if team already has 4 members
    if (team.participants.length >= 4) {
      console.log('Middleware: Team is at maximum capacity (4 members)');
      return res.status(400).json({
        success: false,
        error: 'This team has reached the maximum capacity of 4 members'
      });
    }

    // Add the team name to the request for consistency
    req.body.teamName = team.name;
    
    console.log('Middleware: Team has capacity for more members');
    next();
  } catch (error) {
    console.error('Middleware error in checkTeamCapacity:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while checking team capacity'
    });
  }
};

/**
 * Middleware to check if a participant can join a new team during update
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const checkTeamChangeCapacity = async (req, res, next) => {
  try {
    // If no team code in request or no id parameter, skip the check
    if (!req.body.teamCode || !req.params.id) {
      return next();
    }

    console.log('Middleware: Checking team change capacity');

    // Get current participant
    const currentParticipant = await Participant.findById(req.params.id);
    
    if (!currentParticipant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // If not changing teams (same team code), skip the check
    if (currentParticipant.teamCode === req.body.teamCode) {
      console.log('Middleware: Not changing teams, skipping capacity check');
      return next();
    }

    // Check if new team exists and has capacity
    const newTeam = await Team.findOne({ teamCode: req.body.teamCode });
    
    if (!newTeam) {
      console.log('Middleware: Invalid team code');
      return res.status(404).json({
        success: false,
        error: 'Invalid team code. Please check with the team leader.'
      });
    }
    
    if (newTeam.participants.length >= 4) {
      console.log('Middleware: New team is at maximum capacity');
      return res.status(400).json({
        success: false,
        error: 'The team you are trying to join has reached the maximum capacity of 4 members'
      });
    }

    // Add the team name to the request for consistency
    req.body.teamName = newTeam.name;

    console.log('Middleware: New team has capacity');
    next();
  } catch (error) {
    console.error('Middleware error in checkTeamChangeCapacity:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while checking team capacity for update'
    });
  }
};

module.exports = {
  checkTeamCapacity,
  checkTeamChangeCapacity
}; 