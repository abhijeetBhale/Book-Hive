import Challenge from '../models/Challenge.js';
import UserStats from '../models/UserStats.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Public
export const getChallenges = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    type,
    difficulty,
    duration,
    status = 'active',
    featured = false,
    club
  } = req.query;

  // Build query
  let query = { isActive: true };
  
  if (type) {
    query.type = type;
  }
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  if (duration) {
    query.duration = duration;
  }
  
  if (featured === 'true') {
    query.isFeatured = true;
  }
  
  if (club) {
    query.club = club;
  } else {
    query.isGlobal = true; // Only global challenges if no club specified
  }

  // Filter by status
  const now = new Date();
  if (status === 'active') {
    query.startDate = { $lte: now };
    query.endDate = { $gte: now };
  } else if (status === 'upcoming') {
    query.startDate = { $gt: now };
  } else if (status === 'ended') {
    query.endDate = { $lt: now };
  }

  const challenges = await Challenge.find(query)
    .populate('createdBy', 'name avatar')
    .populate('club', 'name')
    .sort({ isFeatured: -1, startDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Challenge.countDocuments(query);

  // Add user participation info if logged in
  let challengesWithParticipation = challenges;
  if (req.user) {
    challengesWithParticipation = challenges.map(challenge => {
      const userParticipation = challenge.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );
      return {
        ...challenge,
        userParticipation: userParticipation || null
      };
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      challenges: challengesWithParticipation,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single challenge
// @route   GET /api/challenges/:id
// @access  Public
export const getChallenge = catchAsync(async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id)
    .populate('createdBy', 'name avatar location')
    .populate('club', 'name description')
    .populate('participants.user', 'name avatar')
    .lean();

  if (!challenge) {
    return next(new AppError('Challenge not found', 404));
  }

  // Get user's participation if logged in
  let userParticipation = null;
  if (req.user) {
    userParticipation = challenge.participants.find(
      p => p.user._id.toString() === req.user._id.toString()
    );
  }

  // Get leaderboard (top 10 participants)
  const leaderboard = challenge.participants
    .filter(p => p.progress.length > 0)
    .map(participant => {
      const totalProgress = participant.progress.reduce((sum, p) => sum + p.percentage, 0);
      const avgProgress = totalProgress / participant.progress.length;
      return {
        ...participant,
        avgProgress,
        totalScore: participant.finalScore || avgProgress
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  res.status(200).json({
    status: 'success',
    data: {
      challenge,
      userParticipation,
      leaderboard
    }
  });
});

// @desc    Create challenge
// @route   POST /api/challenges
// @access  Private (Admin or Club Admin)
export const createChallenge = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    type,
    difficulty,
    duration,
    startDate,
    endDate,
    goals,
    rewards,
    isGlobal,
    club
  } = req.body;

  // Check permissions
  if (isGlobal && req.user.role !== 'admin') {
    return next(new AppError('Only admins can create global challenges', 403));
  }

  if (club) {
    // Check if user is admin/moderator of the club
    const ClubMembership = (await import('../models/ClubMembership.js')).default;
    const membership = await ClubMembership.findOne({
      club,
      user: req.user._id,
      status: 'active',
      role: { $in: ['admin', 'moderator'] }
    });

    if (!membership) {
      return next(new AppError('You do not have permission to create challenges for this club', 403));
    }
  }

  const challenge = await Challenge.create({
    title,
    description,
    type,
    difficulty,
    duration,
    startDate,
    endDate,
    goals,
    rewards,
    isGlobal: isGlobal || false,
    club,
    createdBy: req.user._id
  });

  await challenge.populate('createdBy', 'name avatar');
  if (club) {
    await challenge.populate('club', 'name');
  }

  res.status(201).json({
    status: 'success',
    data: {
      challenge
    }
  });
});

// @desc    Update challenge
// @route   PUT /api/challenges/:id
// @access  Private (Creator or Admin)
export const updateChallenge = catchAsync(async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) {
    return next(new AppError('Challenge not found', 404));
  }

  // Check permissions
  const isCreator = challenge.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    return next(new AppError('You do not have permission to update this challenge', 403));
  }

  // Don't allow updates if challenge has started and has participants
  const now = new Date();
  if (challenge.startDate <= now && challenge.participants.length > 0) {
    return next(new AppError('Cannot update challenge that has started with participants', 400));
  }

  const updatedChallenge = await Challenge.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'name avatar');

  res.status(200).json({
    status: 'success',
    data: {
      challenge: updatedChallenge
    }
  });
});

// @desc    Delete challenge
// @route   DELETE /api/challenges/:id
// @access  Private (Creator or Admin)
export const deleteChallenge = catchAsync(async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) {
    return next(new AppError('Challenge not found', 404));
  }

  // Check permissions
  const isCreator = challenge.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    return next(new AppError('You do not have permission to delete this challenge', 403));
  }

  // Soft delete - mark as inactive
  challenge.isActive = false;
  await challenge.save();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Join challenge
// @route   POST /api/challenges/:id/join
// @access  Private
export const joinChallenge = catchAsync(async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge || !challenge.isActive) {
    return next(new AppError('Challenge not found', 404));
  }

  const now = new Date();
  
  // Check if challenge allows late joining
  if (challenge.startDate < now && !challenge.settings.allowLateJoin) {
    return next(new AppError('This challenge does not allow late joining', 400));
  }

  // Check if challenge has ended
  if (challenge.endDate < now) {
    return next(new AppError('This challenge has ended', 400));
  }

  // Check if user is already participating
  const existingParticipation = challenge.participants.find(
    p => p.user.toString() === req.user._id.toString()
  );

  if (existingParticipation) {
    return next(new AppError('You are already participating in this challenge', 400));
  }

  // Add participant
  try {
    challenge.addParticipant(req.user._id);
    await challenge.save();

    res.status(200).json({
      status: 'success',
      message: 'Successfully joined the challenge'
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// @desc    Leave challenge
// @route   POST /api/challenges/:id/leave
// @access  Private
export const leaveChallenge = catchAsync(async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) {
    return next(new AppError('Challenge not found', 404));
  }

  // Find user's participation
  const participantIndex = challenge.participants.findIndex(
    p => p.user.toString() === req.user._id.toString()
  );

  if (participantIndex === -1) {
    return next(new AppError('You are not participating in this challenge', 400));
  }

  // Remove participant
  challenge.participants.splice(participantIndex, 1);
  await challenge.save();

  res.status(200).json({
    status: 'success',
    message: 'Successfully left the challenge'
  });
});

// @desc    Get user's challenges
// @route   GET /api/challenges/my-challenges
// @access  Private
export const getMyChallenges = catchAsync(async (req, res, next) => {
  const { status = 'all' } = req.query;

  // Find challenges user is participating in
  const now = new Date();
  let query = {
    'participants.user': req.user._id,
    isActive: true
  };

  if (status === 'active') {
    query.startDate = { $lte: now };
    query.endDate = { $gte: now };
  } else if (status === 'completed') {
    query.endDate = { $lt: now };
  } else if (status === 'upcoming') {
    query.startDate = { $gt: now };
  }

  const challenges = await Challenge.find(query)
    .populate('createdBy', 'name avatar')
    .populate('club', 'name')
    .sort({ startDate: -1 })
    .lean();

  // Add user's participation data
  const challengesWithProgress = challenges.map(challenge => {
    const userParticipation = challenge.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );
    return {
      ...challenge,
      userParticipation
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      challenges: challengesWithProgress
    }
  });
});

// @desc    Get challenge leaderboard
// @route   GET /api/challenges/:id/leaderboard
// @access  Public
export const getChallengeLeaderboard = catchAsync(async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id)
    .populate('participants.user', 'name avatar')
    .lean();

  if (!challenge) {
    return next(new AppError('Challenge not found', 404));
  }

  if (!challenge.settings.showLeaderboard) {
    return next(new AppError('Leaderboard is not available for this challenge', 403));
  }

  // Calculate leaderboard
  const leaderboard = challenge.participants
    .filter(p => p.progress.length > 0)
    .map((participant, index) => {
      const totalProgress = participant.progress.reduce((sum, p) => sum + p.percentage, 0);
      const avgProgress = totalProgress / participant.progress.length;
      return {
        rank: index + 1,
        user: participant.user,
        progress: participant.progress,
        avgProgress,
        totalScore: participant.finalScore || avgProgress,
        isCompleted: participant.isCompleted,
        completedAt: participant.completedAt
      };
    })
    .sort((a, b) => {
      // Sort by completion status first, then by score
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;
      return b.totalScore - a.totalScore;
    })
    .map((participant, index) => ({
      ...participant,
      rank: index + 1
    }));

  res.status(200).json({
    status: 'success',
    data: {
      leaderboard
    }
  });
});

// Service function to update challenge progress (called from other controllers)
export const updateChallengeProgress = async (userId, metric, value = 1) => {
  try {
    const now = new Date();
    
    // Find active challenges that track this metric
    const activeChallenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      'goals.metric': metric,
      'participants.user': userId
    });

    for (const challenge of activeChallenges) {
      try {
        challenge.updateProgress(userId, metric, value);
        await challenge.save();
      } catch (error) {
        console.error(`Error updating challenge ${challenge._id} progress:`, error);
      }
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
};