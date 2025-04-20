const Participant = require('../models/Participant');
const Team = require('../models/Team');
const { sendVerificationEmail, sendTeamCodeEmail,sendJoinedTeamEmail } = require('../utils/emailService');

/**
 * @desc    Create a new participant (but don't save to DB until verified)
 * @route   POST /api/participants/register
 * @access  Public
 */
exports.createParticipant = async (req, res, next) => {
  try {
    const { fullName, email, teamName, isTeamLeader, teamCode, ...rest } = req.body;
    console.log('Processing new participant registration:', req.body);

    // Check if email already exists
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    // For non-team leaders, validate team code immediately
    if (!isTeamLeader) {
      // Ensure teamCode is provided
      if (!teamCode) {
        return res.status(400).json({
          success: false,
          error: 'Team code is required for team members'
        });
      }

      console.log('Looking for team with code:', teamCode);

      // Find existing team
      const team = await Team.findOne({ teamCode });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Invalid team code. Please check with your team leader.'
        });
      }

      // Enforce team size limit
      if (team.participants.length >= 4) {
        return res.status(400).json({
          success: false,
          error: 'Team is already full (max 4 members)'
        });
      }
    }

    // Create but don't save the participant yet
    const participant = new Participant({
      fullName,
      email,
      teamName,
      isTeamLeader: isTeamLeader === true,
      isVerified: false,
      ...(teamCode && !isTeamLeader ? { teamCode } : {}), // Only set teamCode if not team leader
      ...rest
    });

    // Generate verification token
    const verificationToken = participant.generateVerificationToken();
    console.log('Verification token generated:', verificationToken);

    // Store in temporary collection or session
    // For this implementation, we'll save to the database but mark as unverified
    await participant.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email to verify your account.'
    });
  } catch (error) {
    console.log('Error processing registration:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }

    next(error);
  }
};

/**
 * @desc    Verify participant email and complete registration
 * @route   GET /api/participants/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    console.log('Verifying email with token:', token);

    const participant = await Participant.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    console.log('Participant found:', participant.email);

    // Now that the participant is verified, complete the registration process
    participant.isVerified = true;
    participant.verificationToken = undefined;
    participant.verificationTokenExpires = undefined;

    let team;
    
    // Handle team creation/joining after verification
    if (participant.isTeamLeader) {
      console.log('Completing team leader registration');

      // Generate team code now that the leader is verified
      const generatedTeamCode = participant.generateTeamCode();
      participant.teamCode = generatedTeamCode;

      // Create a new team
      team = await Team.create({
        name: participant.teamName,
        teamCode: generatedTeamCode,
        teamLeader: participant._id,
        participants: [participant._id]
      });

      console.log('Team created after verification:', team);

      // Send team code email to the verified team leader
      await sendTeamCodeEmail(
        participant.email,
        generatedTeamCode,
        participant.fullName,
        team.name
      );
    } else {
      // For team members, join their team now
      console.log('Completing team member registration with code:', participant.teamCode);
      
      // Find the team again (already validated during initial registration)
      team = await Team.findOne({ teamCode: participant.teamCode });
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team no longer exists. Please contact support.'
        });
      }

      // Find team leader info to include in the email
      const teamLeader = await Participant.findById(team.teamLeader);
      const teamLeaderName = teamLeader ? teamLeader.fullName : 'Unknown';
      
      // Add verified participant to team
      team.participants.push(participant._id);
      await team.save();
      
      console.log('Participant added to team:', team.name);
      
      // Send email to the team member confirming they've joined the team
      await sendJoinedTeamEmail(
        participant.email,
        participant.teamCode,
        participant.fullName,
        team.name,
        teamLeaderName
      );
    }

    await participant.save();

    res.status(200).json({
      success: true,
      data: {
        participant: {
          fullName: participant.fullName,
          email: participant.email,
          teamName: team.name,
          isTeamLeader: participant.isTeamLeader
        }
      },
      message: 'Email verified successfully! ' + 
        (participant.isTeamLeader ? 'Your team has been created and team code sent to your email.' : 'You have been added to the team.')
    });
  } catch (error) {
    console.log('Error verifying email:', error.message);
    next(error);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/participants/resend-verification-email/:id
 * @access  Public
 */
exports.resendVerificationEmail = async (req, res, next) => {
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
};

/**
 * @desc    Get all participants
 * @route   GET /api/participants/get-all-participants
 * @access  Public
 */
exports.getAllParticipants = async (req, res, next) => {
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
};

/**
 * @desc    Get single participant
 * @route   GET /api/participants/get-participant-by-id/:id
 * @access  Public
 */
exports.getParticipantById = async (req, res, next) => {
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
};

/**
 * @desc    Update participant
 * @route   PUT /api/participants/update-participant/:id
 * @access  Public
 */
exports.updateParticipant = async (req, res, next) => {
  try {
    console.log('Updating participant with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Find the participant before update to get the current team info
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
    
    // Handle team changes if there's a team code change
    if (req.body.teamCode && oldParticipant.teamCode !== req.body.teamCode) {
      console.log('Team code changed, updating teams');
      
      // Remove from old team if exists
      if (oldParticipant.teamCode) {
        const oldTeam = await Team.findOne({ teamCode: oldParticipant.teamCode });
        if (oldTeam) {
          console.log('Removing from old team');
          oldTeam.participants = oldTeam.participants.filter(
            p => p.toString() !== participant._id.toString()
          );
          await oldTeam.save();
        }
      }
      
      // Add to new team
      const newTeam = await Team.findOne({ teamCode: req.body.teamCode });
      if (newTeam) {
        console.log('Adding to new team');
        newTeam.participants.push(participant._id);
        await newTeam.save();
      }
    }
    
    console.log('Participant updated successfully');
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
    
    next(error);
  }
};

/**
 * @desc    Get participants by name
 * @route   GET /api/participants/get-participants-by-name
 * @access  Public
 */
exports.getParticipantsByName = async (req, res, next) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name parameter is required'
      });
    }
    
    console.log('Searching for participants with name containing:', name);
    
    // Create a case-insensitive regex to search for the name
    const nameRegex = new RegExp(name, 'i');
    
    // Search for participants with the name in their fullName field
    const participants = await Participant.find({ fullName: { $regex: nameRegex } });
    
    console.log(`Found ${participants.length} participants matching the name: ${name}`);
    
    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    console.log('Error searching participants by name:', error.message);
    next(error);
  }
};