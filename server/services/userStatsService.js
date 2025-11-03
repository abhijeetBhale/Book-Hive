import UserStats from '../models/UserStats.js';
import User from '../models/User.js';

/**
 * Get or create user stats for a user
 * @param {string} userId - The user ID
 * @returns {Promise<UserStats>} User stats document
 */
export const getOrCreateUserStats = async (userId) => {
  try {
    let userStats = await UserStats.findOne({ user: userId });
    
    if (!userStats) {
      // Create new user stats
      userStats = new UserStats({
        user: userId,
        reading: {
          booksRead: 0,
          pagesRead: 0,
          readingStreak: {
            current: 0,
            longest: 0
          },
          favoriteGenres: [],
          readingGoals: {
            yearly: { target: 12, current: 0, year: new Date().getFullYear() },
            monthly: { target: 1, current: 0, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
          }
        },
        sharing: {
          booksLent: 0,
          booksBorrowed: 0,
          successfulTransactions: 0,
          lendingStreak: { current: 0, longest: 0 },
          averageRating: 0,
          totalRatings: 0
        },
        community: {
          clubsJoined: 0,
          clubsCreated: 0,
          postsCreated: 0,
          commentsPosted: 0,
          eventsAttended: 0,
          eventsOrganized: 0,
          friendsMade: 0,
          helpfulVotes: 0
        },
        gamification: {
          totalPoints: 0,
          currentLevel: 1,
          experiencePoints: 0,
          achievementsEarned: 0,
          badgesEarned: [],
          titles: [],
          challengesCompleted: 0
        },
        activity: {
          daysActive: 1,
          loginStreak: { current: 1, longest: 1, lastLoginDate: new Date() },
          lastActivity: new Date(),
          totalSessions: 1,
          averageSessionTime: 0
        },
        monthlyStats: [],
        achievementProgress: []
      });
      
      await userStats.save();
      console.log(`Created user stats for user: ${userId}`);
    }
    
    return userStats;
  } catch (error) {
    console.error('Error getting or creating user stats:', error);
    throw error;
  }
};

/**
 * Initialize stats for all existing users who don't have stats
 */
export const initializeAllUserStats = async () => {
  try {
    const users = await User.find({}).select('_id');
    let created = 0;
    
    for (const user of users) {
      const existingStats = await UserStats.findOne({ user: user._id });
      if (!existingStats) {
        await getOrCreateUserStats(user._id);
        created++;
      }
    }
    
    console.log(`Initialized stats for ${created} users`);
    return created;
  } catch (error) {
    console.error('Error initializing user stats:', error);
    throw error;
  }
};

/**
 * Update user stats when they perform actions
 * @param {string} userId - User ID
 * @param {string} action - Action type (book_read, book_lent, etc.)
 * @param {object} data - Additional data for the action
 */
export const updateUserStats = async (userId, action, data = {}) => {
  try {
    const userStats = await getOrCreateUserStats(userId);
    
    switch (action) {
      case 'book_read':
        userStats.updateReadingStats(data);
        userStats.gamification.totalPoints += 10;
        userStats.gamification.experiencePoints += 10;
        break;
        
      case 'book_lent':
        userStats.updateSharingStats('lent', data.rating);
        userStats.gamification.totalPoints += 15;
        userStats.gamification.experiencePoints += 15;
        break;
        
      case 'book_borrowed':
        userStats.updateSharingStats('borrowed', data.rating);
        userStats.gamification.totalPoints += 5;
        userStats.gamification.experiencePoints += 5;
        break;
        
      case 'club_joined':
        userStats.community.clubsJoined += 1;
        userStats.gamification.totalPoints += 20;
        userStats.gamification.experiencePoints += 20;
        break;
        
      case 'club_created':
        userStats.community.clubsCreated += 1;
        userStats.gamification.totalPoints += 50;
        userStats.gamification.experiencePoints += 50;
        break;
        
      case 'post_created':
        userStats.community.postsCreated += 1;
        userStats.gamification.totalPoints += 5;
        userStats.gamification.experiencePoints += 5;
        break;
        
      case 'daily_login':
        const today = new Date();
        const lastLogin = userStats.activity.loginStreak.lastLoginDate;
        
        if (lastLogin) {
          const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            userStats.activity.loginStreak.current += 1;
            userStats.gamification.totalPoints += 2;
            userStats.gamification.experiencePoints += 2;
          } else if (daysDiff > 1) {
            userStats.activity.loginStreak.current = 1;
          }
        } else {
          userStats.activity.loginStreak.current = 1;
        }
        
        if (userStats.activity.loginStreak.current > userStats.activity.loginStreak.longest) {
          userStats.activity.loginStreak.longest = userStats.activity.loginStreak.current;
        }
        
        userStats.activity.loginStreak.lastLoginDate = today;
        userStats.activity.lastActivity = today;
        userStats.activity.totalSessions += 1;
        break;
    }
    
    // Recalculate level
    const newLevel = Math.floor(userStats.gamification.experiencePoints / 100) + 1;
    if (newLevel > userStats.gamification.currentLevel) {
      userStats.gamification.currentLevel = newLevel;
    }
    
    await userStats.save();
    return userStats;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

export default {
  getOrCreateUserStats,
  initializeAllUserStats,
  updateUserStats
};