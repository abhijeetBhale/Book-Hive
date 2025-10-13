import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Reading Statistics
  reading: {
    booksRead: {
      type: Number,
      default: 0
    },
    pagesRead: {
      type: Number,
      default: 0
    },
    readingStreak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastReadDate: Date
    },
    favoriteGenres: [{
      genre: String,
      count: Number
    }],
    readingGoals: {
      yearly: {
        target: Number,
        current: Number,
        year: Number
      },
      monthly: {
        target: Number,
        current: Number,
        month: Number,
        year: Number
      }
    }
  },
  // Lending & Borrowing Statistics
  sharing: {
    booksLent: {
      type: Number,
      default: 0
    },
    booksBorrowed: {
      type: Number,
      default: 0
    },
    successfulTransactions: {
      type: Number,
      default: 0
    },
    lendingStreak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      }
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  // Community Statistics
  community: {
    clubsJoined: {
      type: Number,
      default: 0
    },
    clubsCreated: {
      type: Number,
      default: 0
    },
    postsCreated: {
      type: Number,
      default: 0
    },
    commentsPosted: {
      type: Number,
      default: 0
    },
    eventsAttended: {
      type: Number,
      default: 0
    },
    eventsOrganized: {
      type: Number,
      default: 0
    },
    friendsMade: {
      type: Number,
      default: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0
    }
  },
  // Gamification Statistics
  gamification: {
    totalPoints: {
      type: Number,
      default: 0
    },
    currentLevel: {
      type: Number,
      default: 1
    },
    experiencePoints: {
      type: Number,
      default: 0
    },
    achievementsEarned: {
      type: Number,
      default: 0
    },
    badgesEarned: [{
      badge: String,
      earnedAt: Date,
      category: String
    }],
    titles: [{
      title: String,
      earnedAt: Date,
      isActive: Boolean
    }],
    challengesCompleted: {
      type: Number,
      default: 0
    }
  },
  // Activity Statistics
  activity: {
    daysActive: {
      type: Number,
      default: 0
    },
    loginStreak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastLoginDate: Date
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    averageSessionTime: {
      type: Number,
      default: 0 // in minutes
    }
  },
  // Monthly/Yearly Breakdowns
  monthlyStats: [{
    year: Number,
    month: Number,
    booksRead: Number,
    booksLent: Number,
    clubActivity: Number,
    pointsEarned: Number
  }],
  // Achievements Progress
  achievementProgress: [{
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    progress: Number,
    target: Number,
    lastUpdated: Date
  }]
}, {
  timestamps: true
});

// Indexes for leaderboards and queries
userStatsSchema.index({ 'gamification.totalPoints': -1 });
userStatsSchema.index({ 'reading.booksRead': -1 });
userStatsSchema.index({ 'sharing.booksLent': -1 });
userStatsSchema.index({ 'community.clubsJoined': -1 });
userStatsSchema.index({ 'gamification.currentLevel': -1 });
userStatsSchema.index({ 'activity.loginStreak.current': -1 });

// Methods for updating stats
userStatsSchema.methods.updateReadingStats = function(bookData) {
  this.reading.booksRead += 1;
  this.reading.pagesRead += bookData.pages || 0;
  
  // Update reading streak
  const today = new Date();
  const lastRead = this.reading.readingStreak.lastReadDate;
  
  if (lastRead) {
    const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      this.reading.readingStreak.current += 1;
    } else if (daysDiff > 1) {
      this.reading.readingStreak.current = 1;
    }
  } else {
    this.reading.readingStreak.current = 1;
  }
  
  // Update longest streak
  if (this.reading.readingStreak.current > this.reading.readingStreak.longest) {
    this.reading.readingStreak.longest = this.reading.readingStreak.current;
  }
  
  this.reading.readingStreak.lastReadDate = today;
  
  // Update favorite genres
  if (bookData.genre) {
    const genreIndex = this.reading.favoriteGenres.findIndex(g => g.genre === bookData.genre);
    if (genreIndex >= 0) {
      this.reading.favoriteGenres[genreIndex].count += 1;
    } else {
      this.reading.favoriteGenres.push({ genre: bookData.genre, count: 1 });
    }
  }
};

userStatsSchema.methods.updateSharingStats = function(type, rating = null) {
  if (type === 'lent') {
    this.sharing.booksLent += 1;
  } else if (type === 'borrowed') {
    this.sharing.booksBorrowed += 1;
  }
  
  this.sharing.successfulTransactions += 1;
  
  // Update rating average
  if (rating) {
    const totalRating = (this.sharing.averageRating * this.sharing.totalRatings) + rating;
    this.sharing.totalRatings += 1;
    this.sharing.averageRating = totalRating / this.sharing.totalRatings;
  }
};

userStatsSchema.methods.addPoints = function(points, source = 'general') {
  this.gamification.totalPoints += points;
  this.gamification.experiencePoints += points;
  
  // Calculate level (every 100 points = 1 level)
  const newLevel = Math.floor(this.gamification.experiencePoints / 100) + 1;
  if (newLevel > this.gamification.currentLevel) {
    this.gamification.currentLevel = newLevel;
    return { levelUp: true, newLevel };
  }
  
  return { levelUp: false };
};

const UserStats = mongoose.model('UserStats', userStatsSchema);
export default UserStats;