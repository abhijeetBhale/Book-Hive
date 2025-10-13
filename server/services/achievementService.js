import Achievement from '../models/Achievement.js';
import UserStats from '../models/UserStats.js';
import { checkAchievements } from '../controllers/achievementController.js';

// Initialize default achievements
export const initializeDefaultAchievements = async () => {
  try {
    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      console.log('Achievements already initialized');
      return;
    }

    const defaultAchievements = [
      // Reading Achievements
      {
        name: 'First Page Turner',
        description: 'Read your first book on BookHive',
        icon: '📖',
        category: 'reading',
        type: 'milestone',
        criteria: {
          metric: 'books_read',
          target: 1
        },
        rewards: {
          points: 50,
          badge: 'First Reader',
          title: 'Bookworm Beginner'
        },
        rarity: 'common'
      },
      {
        name: 'Bookworm',
        description: 'Read 10 books',
        icon: '🐛',
        category: 'reading',
        type: 'count',
        criteria: {
          metric: 'books_read',
          target: 10
        },
        rewards: {
          points: 200,
          badge: 'Dedicated Reader',
          title: 'Bookworm'
        },
        rarity: 'uncommon'
      },
      {
        name: 'Library Master',
        description: 'Read 50 books',
        icon: '📚',
        category: 'reading',
        type: 'count',
        criteria: {
          metric: 'books_read',
          target: 50
        },
        rewards: {
          points: 1000,
          badge: 'Library Master',
          title: 'Master Reader'
        },
        rarity: 'rare'
      },
      {
        name: 'Reading Streak',
        description: 'Read for 7 consecutive days',
        icon: '🔥',
        category: 'reading',
        type: 'streak',
        criteria: {
          metric: 'consecutive_days',
          target: 7
        },
        rewards: {
          points: 150,
          badge: 'Streak Master'
        },
        rarity: 'uncommon'
      },

      // Lending Achievements
      {
        name: 'Generous Soul',
        description: 'Lend your first book',
        icon: '🤝',
        category: 'lending',
        type: 'milestone',
        criteria: {
          metric: 'books_lent',
          target: 1
        },
        rewards: {
          points: 75,
          badge: 'First Lender',
          title: 'Generous Reader'
        },
        rarity: 'common'
      },
      {
        name: 'Community Helper',
        description: 'Lend 25 books to other users',
        icon: '🌟',
        category: 'lending',
        type: 'count',
        criteria: {
          metric: 'books_lent',
          target: 25
        },
        rewards: {
          points: 500,
          badge: 'Community Helper',
          title: 'Book Sharer'
        },
        rarity: 'rare'
      },

      // Community Achievements
      {
        name: 'Club Joiner',
        description: 'Join your first book club',
        icon: '👥',
        category: 'community',
        type: 'milestone',
        criteria: {
          metric: 'clubs_joined',
          target: 1
        },
        rewards: {
          points: 100,
          badge: 'Club Member',
          title: 'Community Member'
        },
        rarity: 'common'
      },
      {
        name: 'Social Butterfly',
        description: 'Join 5 different book clubs',
        icon: '🦋',
        category: 'community',
        type: 'count',
        criteria: {
          metric: 'clubs_joined',
          target: 5
        },
        rewards: {
          points: 300,
          badge: 'Social Butterfly',
          title: 'Club Enthusiast'
        },
        rarity: 'uncommon'
      },

      // Special Achievements
      {
        name: 'Early Adopter',
        description: 'One of the first 100 users on BookHive',
        icon: '🚀',
        category: 'special',
        type: 'special',
        criteria: {
          conditions: [
            {
              field: 'user_id',
              operator: 'less_than',
              value: 100
            }
          ]
        },
        rewards: {
          points: 500,
          badge: 'Early Adopter',
          title: 'Pioneer'
        },
        rarity: 'legendary',
        isHidden: true
      },

      // Milestone Achievements
      {
        name: 'Century Club',
        description: 'Read 100 books',
        icon: '💯',
        category: 'reading',
        type: 'milestone',
        criteria: {
          metric: 'books_read',
          target: 100
        },
        rewards: {
          points: 2000,
          badge: 'Century Reader',
          title: 'Literary Legend'
        },
        rarity: 'epic'
      },

      // Social Achievements
      {
        name: 'Review Master',
        description: 'Write 50 book reviews',
        icon: '✍️',
        category: 'social',
        type: 'count',
        criteria: {
          metric: 'reviews_written',
          target: 50
        },
        rewards: {
          points: 400,
          badge: 'Review Master',
          title: 'Critic'
        },
        rarity: 'uncommon'
      }
    ];

    await Achievement.insertMany(defaultAchievements);
    console.log('✅ Default achievements initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing achievements:', error);
  }
};

// Initialize user stats for existing users
export const initializeUserStats = async (userId) => {
  try {
    const existingStats = await UserStats.findOne({ user: userId });
    if (existingStats) {
      return existingStats;
    }

    const userStats = await UserStats.create({
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
          yearly: {
            target: 12,
            current: 0,
            year: new Date().getFullYear()
          }
        }
      },
      sharing: {
        booksLent: 0,
        booksBorrowed: 0,
        successfulTransactions: 0,
        averageRating: 0,
        totalRatings: 0
      },
      community: {
        clubsJoined: 0,
        clubsCreated: 0,
        postsCreated: 0,
        commentsPosted: 0,
        eventsAttended: 0,
        friendsMade: 0
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
        daysActive: 0,
        loginStreak: {
          current: 0,
          longest: 0
        },
        lastActivity: new Date(),
        totalSessions: 0,
        averageSessionTime: 0
      }
    });

    console.log(`✅ User stats initialized for user: ${userId}`);
    return userStats;
  } catch (error) {
    console.error('❌ Error initializing user stats:', error);
    throw error;
  }
};

// Update user stats and check achievements
export const updateUserStatsAndAchievements = async (userId, eventType, eventData = {}) => {
  try {
    let userStats = await UserStats.findOne({ user: userId });
    if (!userStats) {
      userStats = await initializeUserStats(userId);
    }

    // Update stats based on event type
    switch (eventType) {
      case 'book_read':
        userStats.updateReadingStats(eventData);
        break;
      case 'book_lent':
        userStats.updateSharingStats('lent', eventData.rating);
        break;
      case 'book_borrowed':
        userStats.updateSharingStats('borrowed');
        break;
      case 'club_joined':
        userStats.community.clubsJoined += 1;
        break;
      case 'club_created':
        userStats.community.clubsCreated += 1;
        break;
      case 'post_created':
        userStats.community.postsCreated += 1;
        break;
      case 'comment_posted':
        userStats.community.commentsPosted += 1;
        break;
      case 'event_attended':
        userStats.community.eventsAttended += 1;
        break;
      case 'friend_added':
        userStats.community.friendsMade += 1;
        break;
      case 'daily_login':
        updateLoginStreak(userStats);
        break;
      case 'points_awarded':
        userStats.addPoints(eventData.points || 0, eventData.source);
        break;
    }

    await userStats.save();

    // Check for new achievements
    await checkAchievements(userId, eventType, eventData);

    return userStats;
  } catch (error) {
    console.error('❌ Error updating user stats:', error);
    throw error;
  }
};

// Update login streak
function updateLoginStreak(userStats) {
  const today = new Date();
  const lastLogin = userStats.activity.loginStreak.lastLoginDate;
  
  if (lastLogin) {
    const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      userStats.activity.loginStreak.current += 1;
    } else if (daysDiff > 1) {
      userStats.activity.loginStreak.current = 1;
    }
  } else {
    userStats.activity.loginStreak.current = 1;
  }
  
  // Update longest streak
  if (userStats.activity.loginStreak.current > userStats.activity.loginStreak.longest) {
    userStats.activity.loginStreak.longest = userStats.activity.loginStreak.current;
  }
  
  userStats.activity.loginStreak.lastLoginDate = today;
  userStats.activity.daysActive += 1;
}

// Award points for various actions
export const awardPoints = async (userId, action, amount = null) => {
  const pointsMap = {
    'book_read': 25,
    'book_lent': 15,
    'book_borrowed': 10,
    'review_written': 20,
    'club_joined': 30,
    'club_created': 100,
    'post_created': 15,
    'comment_posted': 5,
    'event_attended': 25,
    'friend_added': 10,
    'daily_login': 5,
    'achievement_earned': 0 // Points are handled by achievement itself
  };

  const points = amount || pointsMap[action] || 0;
  
  if (points > 0) {
    await updateUserStatsAndAchievements(userId, 'points_awarded', {
      points,
      source: action
    });
  }
};