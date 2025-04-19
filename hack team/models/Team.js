const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true
  },
  teamCode: {
    type: String,
    required: [true, 'Team code is required'],
    unique: true
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Pre-save validation for team size
teamSchema.pre('save', function(next) {
  if (this.participants && this.participants.length > 4) {
    const error = new Error('Team cannot have more than 4 participants');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema); 