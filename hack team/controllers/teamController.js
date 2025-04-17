const Team = require('../models/Team');

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Public
 */
exports.createTeam = async (req, res, next) => {
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
};

/**
 * @desc    Get all teams
 * @route   GET /api/teams/get-all-teams
 * @access  Public
 */
exports.getAllTeams = async (req, res, next) => {
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
};

/**
 * @desc    Get team by id
 * @route   GET /api/teams/get-team-by-id/:id
 * @access  Public
 */
exports.getTeamById = async (req, res, next) => {
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
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/update-team/:id
 * @access  Public
 */
exports.updateTeam = async (req, res, next) => {
  try {
    console.log('Updating team with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Check if team exists
    const existingTeam = await Team.findById(req.params.id);
    if (!existingTeam) {
      console.log('Team not found for update');
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
};

/**
 * @desc    Get team stats (count by status)
 * @route   GET /api/teams/stats
 * @access  Public
 */
exports.getTeamStats = async (req, res, next) => {
  try {
    console.log('Fetching team statistics');
    
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
    
    console.log('Team statistics:', formattedStats);
    
    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.log('Error fetching team statistics:', error.message);
    next(error);
  }
}; 