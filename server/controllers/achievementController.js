import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import UserStats from '../models/UserStats.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
export const getAchievements = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    category,
    rarity,
    type,
    showHidden = false
  } = req.query;

  // Build query
  let query = { isActive: true };
  
  if (category) {
    query.category = category;
  }
  
  if (rarity) {
    query.rarity = rarity;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (showHidden !== 'true') {
    query.isHidden = false;
  }

  const achievements = await Achievement.find(query)
    .sort({ rarity: 1, category: 1, name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Achievement.countDocuments(query);

  // If user is logged in, get their progress
  let userProgress = {};
  if (req.user) {
    const userAchievements = await UserAchievement.find({
      user: req.user._id,
      achievement: { $in: achievements.map(a => a._id) }
    }).lean();

    userProgress = userAchievements.reduce((acc, ua) => {
      acc[ua.achievement] = ua;
      return acc;
    }, {});
  }

  // Add user progress to achievements
  const achievementsWithProgress = achievements.map(achievement => ({
    ...achievement,
    userProgress: userProgress[achievement._id] || null
  }));

  res.status(200).json({
    status: 'success',
    data: {
      achievements: achievementsWithProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user's achievements
// @route   GET /api/achievements/my-achievements
// @access  Private
export const getMyAchievements = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    completed = 'all',
    category
  } = req.query;

  // Build query
  let query = { user: req.user._id };
  
  if (completed === 'true') {
    query.isCompleted = true;
  } else if (completed === 'false') {
    query.isCompleted = false;
  }

  const userAchievements = await UserAchievement.find(query)
    .populate({
      path: 'achievement',
      match: category ? { category } : {},
      select: 'name description icon category type rarity rewards'
    })
    .sort({ completedAt: -1, 'progress.percentage': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Filter out achievements that don't match category filter
  const filteredAchievements = userAchievements.filter(ua => ua.achievement);

  const total = await UserAchievement.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      achievements: filteredAchievements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get achievement leaderboard
// @route   GET /api/achievements/leaderboard
// @access  Public
export const getAchievementLeaderboard = catchAsync(async (req, res, next) => {
  const { limit = 50, metric = 'totalPoints' } = req.query;

  let sortField;
  switch (metric) {
    case 'totalPoints':
      sortField = 'gamification.totalPoints';
      break;
    case 'achievementsEarned':
      sortField = 'gamification.achievementsEarned';
      break;
    case 'currentLevel':
      sortField = 'gamification.currentLevel';
      break;
    case 'booksRead':
      sortField = 'reading.booksRead';
      break;
    case 'booksLent':
      sortField = 'sharing.booksLent';
      break;
    default:
      sortField = 'gamification.totalPoints';
  }

  const leaderboard = await UserStats.find({})
    .populate('user', 'name avatar location')
    .sort({ [sortField]: -1 })
    .limit(parseInt(limit))
    .lean();

  res.status(200).json({
    status: 'success',
    data: {
      leaderboard: leaderboard.map((stats, index) => ({
        rank: index + 1,
        user: stats.user,
        value: getNestedValue(stats, sortField),
        level: stats.gamification.currentLevel,
        totalPoints: stats.gamification.totalPoints
      }))
    }
  });
});

// @desc    Get user stats
// @route   GET /api/achievements/stats/:userId?
// @access  Public
export const getUserStats = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user?._id;
  
  if (!userId) {
    return next(new AppError('User ID is required', 400));
  }

  const userStats = await UserStats.findOne({ user: userId })
    .populate('user', 'name avatar location createdAt')
    .lean();

  if (!userStats) {
    return next(new AppError('User stats not found', 404));
  }

  // Get recent achievements
  const recentAchievements = await UserAchievement.find({
    user: userId,
    isCompleted: true
  })
    .populate('achievement', 'name icon rarity rewards')
    .sort({ completedAt: -1 })
    .limit(5)
    .lean();

  // Get user's rank in different categories
  const totalPointsRank = await UserStats.countDocuments({
    'gamification.totalPoints': { $gt: userStats.gamification.totalPoints }
  }) + 1;

  const booksReadRank = await UserStats.countDocuments({
    'reading.booksRead': { $gt: userStats.reading.booksRead }
  }) + 1;

  res.status(200).json({
    status: 'success',
    data: {
      userStats,
      recentAchievements,
      rankings: {
        totalPoints: totalPointsRank,
        booksRead: booksReadRank
      }
    }
  });
});

// @desc    Create achievement (Admin only)
// @route   POST /api/achievements
// @access  Private (Admin)
export const createAchievement = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can create achievements', 403));
  }

  const achievement = await Achievement.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      achievement
    }
  });
});

// @desc    Update achievement (Admin only)
// @route   PUT /api/achievements/:id
// @access  Private (Admin)
export const updateAchievement = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can update achievements', 403));
  }

  const achievement = await Achievement.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!achievement) {
    return next(new AppError('Achievement not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      achievement
    }
  });
});

// @desc    Delete achievement (Admin only)
// @route   DELETE /api/achievements/:id
// @access  Private (Admin)
export const deleteAchievement = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can delete achievements', 403));
  }

  const achievement = await Achievement.findById(req.params.id);
  if (!achievement) {
    return next(new AppError('Achievement not found', 404));
  }

  // Soft delete - mark as inactive
  achievement.isActive = false;
  await achievement.save();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj) || 0;
}

// Achievement checking service (called from other controllers)
export const checkAchievements = async (userId, eventType, eventData = {}) => {
  try {
    const userStats = await UserStats.findOne({ user: userId });
    if (!userStats) return;

    // Get all active achievements that user hasn't completed
    const completedAchievements = await UserAchievement.find({
      user: userId,
      isCompleted: true
    }).select('achievement');

    const completedIds = completedAchievements.map(ua => ua.achievement);

    const availableAchievements = await Achievement.find({
      isActive: true,
      _id: { $nin: completedIds }
    });

    for (const achievement of availableAchievements) {
      await checkSingleAchievement(userId, achievement, userStats, eventType, eventData);
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

// Check individual achievement
async function checkSingleAchievement(userId, achievement, userStats, eventType, eventData) {
  let progress = 0;
  let target = achievement.criteria.target || 1;
  let shouldUpdate = false;

  // Check if achievement criteria match the event
  switch (achievement.criteria.metric) {
    case 'books_read':
      if (eventType === 'book_read') {
        progress = userStats.reading.booksRead;
        shouldUpdate = true;
      }
      break;
    case 'books_lent':
      if (eventType === 'book_lent') {
        progress = userStats.sharing.booksLent;
        shouldUpdate = true;
      }
      break;
    case 'books_borrowed':
      if (eventType === 'book_borrowed') {
        progress = userStats.sharing.booksBorrowed;
        shouldUpdate = true;
      }
      break;
    case 'clubs_joined':
      if (eventType === 'club_joined') {
        progress = userStats.community.clubsJoined;
        shouldUpdate = true;
      }
      break;
    case 'consecutive_days':
      if (eventType === 'daily_login') {
        progress = userStats.activity.loginStreak.current;
        shouldUpdate = true;
      }
      break;
    // Add more metrics as needed
  }

  if (shouldUpdate) {
    // Update or create user achievement progress
    let userAchievement = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id
    });

    if (!userAchievement) {
      userAchievement = new UserAchievement({
        user: userId,
        achievement: achievement._id,
        progress: {
          current: progress,
          target: target
        }
      });
    } else {
      userAchievement.progress.current = progress;
    }

    await userAchievement.save();

    // If completed, award points
    if (userAchievement.isCompleted && !userAchievement.notified) {
      await awardAchievement(userId, achievement);
      userAchievement.notified = true;
      await userAchievement.save();
    }
  }
}

// Award achievement points and update stats
async function awardAchievement(userId, achievement) {
  const userStats = await UserStats.findOne({ user: userId });
  if (!userStats) return;

  // Add points
  const pointsAwarded = achievement.rewards.points || 0;
  const levelUpResult = userStats.addPoints(pointsAwarded, 'achievement');

  // Update achievement count
  userStats.gamification.achievementsEarned += 1;

  // Add badge if provided
  if (achievement.rewards.badge) {
    userStats.gamification.badgesEarned.push({
      badge: achievement.rewards.badge,
      earnedAt: new Date(),
      category: achievement.category
    });
  }

  // Add title if provided
  if (achievement.rewards.title) {
    userStats.gamification.titles.push({
      title: achievement.rewards.title,
      earnedAt: new Date(),
      isActive: false // User can choose to activate it
    });
  }

  await userStats.save();

  // TODO: Send notification to user about achievement
  console.log(`User ${userId} earned achievement: ${achievement.name}`);
  
  return {
    achievement,
    pointsAwarded,
    levelUp: levelUpResult.levelUp,
    newLevel: levelUpResult.newLevel
  };
}