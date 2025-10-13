import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  notified: {
    type: Boolean,
    default: false
  },
  metadata: {
    // Store additional context about how achievement was earned
    triggerEvent: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    streakData: {
      startDate: Date,
      endDate: Date,
      currentStreak: Number
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure one achievement per user
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isCompleted: 1 });
userAchievementSchema.index({ achievement: 1, isCompleted: 1 });
userAchievementSchema.index({ completedAt: -1 });

// Update progress percentage when current progress changes
userAchievementSchema.pre('save', function(next) {
  if (this.isModified('progress.current') || this.isModified('progress.target')) {
    this.progress.percentage = Math.min(100, (this.progress.current / this.progress.target) * 100);
    
    // Mark as completed if target is reached
    if (this.progress.current >= this.progress.target && !this.isCompleted) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
  }
  next();
});

// Update achievement stats when completed
userAchievementSchema.post('save', async function() {
  if (this.isCompleted && this.isModified('isCompleted')) {
    const Achievement = mongoose.model('Achievement');
    const achievement = await Achievement.findById(this.achievement);
    
    if (achievement) {
      // Update total earned count
      achievement.stats.totalEarned += 1;
      
      // Set first earned info if this is the first
      if (achievement.stats.totalEarned === 1) {
        achievement.stats.firstEarnedBy = this.user;
        achievement.stats.firstEarnedAt = this.completedAt;
      }
      
      await achievement.save();
    }
  }
});

const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
export default UserAchievement;