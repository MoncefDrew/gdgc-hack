const Team = require('../models/Team');

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Public
 */
exports.createTeam = async (req, res, next) => {
  try {
    
    const team = await Team.create(req.body);
    
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
};

/**
 * @desc    Get all teams
 * @route   GET /api/teams/get-all-teams
 * @access  Public
 */
exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find().populate('participants');
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.log('Error fetching teams:', error.message);
    next(error);
  }
};

/**
 * @desc    Get team by id
 * @route   GET /api/teams/get-team-by-id/:id
 * @access  Public
 */
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('participants');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.log('Error fetching team:', error.message);
    next(error);
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/update-team/:id
 * @access  Public
 */
exports.updateTeam = async (req, res, next) => {
  try {

    
    // Check if team exists
    const existingTeam = await Team.findById(req.params.id);
    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Update the team
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('participants');
    
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
};

/**
 * @desc    Get team stats (count by status)
 * @route   GET /api/teams/stats
 * @access  Public
 */
exports.getTeamStats = async (req, res, next) => {
  try {
    
    // Get counts by status
    const stats = await Team.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Transform to a more readable format
    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });
    
    // Get total count
    const totalTeams = await Team.countDocuments();
    formattedStats.total = totalTeams;
    
    
    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.log('Error fetching team statistics:', error.message);
    next(error);
  }
};

/**
 * @desc    Get team by code
 * @route   GET /api/teams/by-code/:code
 * @access  Public
 */
exports.getTeamByCode = async (req, res, next) => {
  try {
    const teamCode = req.params.code;
    
    const team = await Team.findOne({ teamCode })
      .populate('teamLeader', 'fullName email')
      .populate('participants', 'fullName email');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found with the provided code'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        name: team.name,
        code: team.teamCode,
        memberCount: team.participants.length,
        teamLeader: team.teamLeader,
        status: team.status
      }
    });
  } catch (error) {
    console.log('Error fetching team by code:', error.message);
    next(error);
  }
};

/**
 * @desc    Validate team code
 * @route   POST /api/teams/validate-code
 * @access  Public
 */
exports.validateTeamCode = async (req, res, next) => {
  try {
    const { teamCode } = req.body;
    
    if (!teamCode) {
      return res.status(400).json({
        success: false,
        error: 'Team code is required'
      });
    }
    
    
    const team = await Team.findOne({ teamCode });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Invalid team code'
      });
    }
    
    // Check if team is full
    if (team.participants.length >= 4) {
      return res.status(400).json({
        success: false,
        error: 'Team is already full (max 4 members)'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        teamName: team.name,
        memberCount: team.participants.length
      },
      message: 'Valid team code'
    });
  } catch (error) {
    console.log('Error validating team code:', error.message);
    next(error);
  }
}; 