import 'dotenv/config';
import mongoose from 'mongoose';
import Achievement from '../models/Achievement.js';
import Challenge from '../models/Challenge.js';
import UserStats from '../models/UserStats.js';
import User from '../models/User.js';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Default achievements
const defaultAchievements = [
  {
    name: 'First Steps',
    description: 'Read your first book on BookHive',
    icon: '📚',
    category: 'reading',
    type: 'milestone',
    criteria: {
      metric: 'books_read',
      target: 1
    },
    rewards: {
      points: 50,
      badge: 'First Reader'
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
      badge: 'Bookworm'
    },
    rarity: 'uncommon'
  },
  {
    name: 'Library Master',
    description: 'Read 50 books',
    icon: '📖',
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
    name: 'Sharing is Caring',
    description: 'Lend your first book to another reader',
    icon: '🤝',
    category: 'lending',
    type: 'milestone',
    criteria: {
      metric: 'books_lent',
      target: 1
    },
    rewards: {
      points: 75,
      badge: 'First Lender'
    },
    rarity: 'common'
  },
  {
    name: 'Community Helper',
    description: 'Lend 10 books to other readers',
    icon: '🌟',
    category: 'lending',
    type: 'count',
    criteria: {
      metric: 'books_lent',
      target: 10
    },
    rewards: {
      points: 500,
      badge: 'Community Helper'
    },
    rarity: 'uncommon'
  },
  {
    name: 'Social Butterfly',
    description: 'Join your first book club',
    icon: '🦋',
    category: 'community',
    type: 'milestone',
    criteria: {
      metric: 'clubs_joined',
      target: 1
    },
    rewards: {
      points: 100,
      badge: 'Club Member'
    },
    rarity: 'common'
  },
  {
    name: 'Club Enthusiast',
    description: 'Join 5 different book clubs',
    icon: '🎭',
    category: 'community',
    type: 'count',
    criteria: {
      metric: 'clubs_joined',
      target: 5
    },
    rewards: {
      points: 300,
      badge: 'Club Enthusiast'
    },
    rarity: 'uncommon'
  },
  {
    name: 'Dedicated Reader',
    description: 'Maintain a 7-day reading streak',
    icon: '🔥',
    category: 'streak',
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
  {
    name: 'Reading Machine',
    description: 'Maintain a 30-day reading streak',
    icon: '⚡',
    category: 'streak',
    type: 'streak',
    criteria: {
      metric: 'consecutive_days',
      target: 30
    },
    rewards: {
      points: 750,
      badge: 'Reading Machine',
      title: 'Unstoppable Reader'
    },
    rarity: 'epic'
  },
  {
    name: 'Legend',
    description: 'Read 100 books and lend 50 books',
    icon: '👑',
    category: 'special',
    type: 'special',
    criteria: {
      metric: 'books_read',
      target: 100
    },
    rewards: {
      points: 2500,
      badge: 'BookHive Legend',
      title: 'Legend of BookHive'
    },
    rarity: 'legendary',
    isHidden: true
  }
];

// Default challenges
const defaultChallenges = [
  {
    title: 'New Year Reading Challenge',
    description: 'Read 12 books in 2024 - one for each month!',
    icon: '🎯',
    type: 'reading',
    difficulty: 'medium',
    duration: 'yearly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    goals: [{
      metric: 'books_read',
      target: 12,
      description: 'Read 12 books throughout the year'
    }],
    rewards: {
      points: 500,
      badge: '2024 Reading Champion',
      title: 'Reading Champion'
    },
    isGlobal: true,
    isFeatured: true
  },
  {
    title: 'Community Builder',
    description: 'Help build our community by sharing books and joining discussions',
    icon: '🏗️',
    type: 'community',
    difficulty: 'easy',
    duration: 'monthly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    goals: [
      {
        metric: 'books_lent',
        target: 3,
        description: 'Lend 3 books to other readers'
      },
      {
        metric: 'clubs_joined',
        target: 1,
        description: 'Join at least one book club'
      }
    ],
    rewards: {
      points: 200,
      badge: 'Community Builder'
    },
    isGlobal: true
  },
  {
    title: 'Reading Streak Master',
    description: 'Build a consistent reading habit',
    icon: '🔥',
    type: 'streak',
    difficulty: 'hard',
    duration: 'monthly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    goals: [{
      metric: 'consecutive_days',
      target: 21,
      description: 'Maintain a 21-day reading streak'
    }],
    rewards: {
      points: 300,
      badge: 'Streak Master',
      title: 'Consistent Reader'
    },
    isGlobal: true
  }
];

// Initialize achievements
const initializeAchievements = async () => {
  try {
    console.log('Initializing achievements...');
    
    for (const achievementData of defaultAchievements) {
      const existingAchievement = await Achievement.findOne({ name: achievementData.name });
      if (!existingAchievement) {
        await Achievement.create(achievementData);
        console.log(`Created achievement: ${achievementData.name}`);
      }
    }
    
    console.log('Achievements initialized successfully');
  } catch (error) {
    console.error('Error initializing achievements:', error);
  }
};

// Initialize challenges
const initializeChallenges = async () => {
  try {
    console.log('Initializing challenges...');
    
    // Get a user to be the creator (first admin or first user)
    const creator = await User.findOne({ role: 'admin' }) || await User.findOne();
    if (!creator) {
      console.log('No users found, skipping challenge creation');
      return;
    }
    
    for (const challengeData of defaultChallenges) {
      const existingChallenge = await Challenge.findOne({ title: challengeData.title });
      if (!existingChallenge) {
        await Challenge.create({
          ...challengeData,
          createdBy: creator._id
        });
        console.log(`Created challenge: ${challengeData.title}`);
      }
    }
    
    console.log('Challenges initialized successfully');
  } catch (error) {
    console.error('Error initializing challenges:', error);
  }
};

// Initialize user stats for existing users
const initializeUserStats = async () => {
  try {
    console.log('Initializing user stats...');
    
    const users = await User.find({});
    let created = 0;
    
    for (const user of users) {
      const existingStats = await UserStats.findOne({ user: user._id });
      if (!existingStats) {
        await UserStats.create({
          user: user._id,
          reading: {
            booksRead: 0,
            pagesRead: 0,
            readingStreak: { current: 0, longest: 0 },
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
          }
        });
        created++;
      }
    }
    
    console.log(`Initialized stats for ${created} users`);
  } catch (error) {
    console.error('Error initializing user stats:', error);
  }
};

// Main initialization function
const initializeGamification = async () => {
  try {
    await connectDB();
    
    await initializeAchievements();
    await initializeChallenges();
    await initializeUserStats();
    
    console.log('Gamification system initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing gamification system:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeGamification();
}

export default initializeGamification;