const Team = require('../models/Team');

/**
 * Middleware to check if a team has reached the maximum capacity of 4 participants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const checkTeamCapacity = async (req, res, next) => {
  try {
    // If no teamName in request, skip the check
    if (!req.body.teamName) {
      return next();
    }

    console.log('Middleware: Checking team capacity for', req.body.teamName);
    const team = await Team.findOne({ name: req.body.teamName });

    // If team doesn't exist yet, it's okay to proceed
    if (!team) {
      console.log('Middleware: Team does not exist yet, proceeding');
      return next();
    }

    // Check if team already has 4 members
    if (team.participants.length >= 4) {
      console.log('Middleware: Team is at maximum capacity (4 members)');
      return res.status(400).json({
        success: false,
        error: 'This team has reached the maximum capacity of 4 members'
      });
    }

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
    // If no teamName in request or no id parameter, skip the check
    if (!req.body.teamName || !req.params.id) {
      return next();
    }

    console.log('Middleware: Checking team change capacity');

    // Get current participant
    const Participant = require('../models/Participant');
    const currentParticipant = await Participant.findById(req.params.id);
    
    if (!currentParticipant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // If not changing teams, skip the check
    if (currentParticipant.teamName === req.body.teamName) {
      console.log('Middleware: Not changing teams, skipping capacity check');
      return next();
    }

    // Check if new team exists and has capacity
    const newTeam = await Team.findOne({ name: req.body.teamName });
    if (newTeam && newTeam.participants.length >= 4) {
      console.log('Middleware: New team is at maximum capacity');
      return res.status(400).json({
        success: false,
        error: 'The team you are trying to join has reached the maximum capacity of 4 members'
      });
    }

    console.log('Middleware: New team has capacity or does not exist yet');
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