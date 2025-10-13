import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Achievement name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    required: true,
    default: '🏆'
  },
  category: {
    type: String,
    enum: [
      'reading', 'lending', 'community', 'social', 'milestone', 
      'special', 'seasonal', 'club', 'streak', 'first-time'
    ],
    required: true
  },
  type: {
    type: String,
    enum: ['count', 'streak', 'milestone', 'special', 'time-based'],
    required: true
  },
  criteria: {
    // For count-based achievements
    metric: {
      type: String,
      enum: [
        'books_read', 'books_lent', 'books_borrowed', 'clubs_joined',
        'posts_created', 'events_attended', 'friends_made', 'reviews_written',
        'days_active', 'consecutive_days', 'points_earned', 'ratings_given'
      ]
    },
    target: {
      type: Number,
      min: 1
    },
    // For time-based achievements
    timeframe: {
      type: String,
      enum: ['day', 'week', 'month', 'year']
    },
    // For special achievements
    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'greater_than', 'less_than', 'contains']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  },
  rewards: {
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    badge: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    specialReward: {
      type: String,
      default: ''
    }
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false // Hidden achievements are surprises
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  stats: {
    totalEarned: {
      type: Number,
      default: 0
    },
    firstEarnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    firstEarnedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ 'criteria.metric': 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;