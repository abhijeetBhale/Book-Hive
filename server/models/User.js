import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function() {
      // Password is only required if user doesn't have googleId (OAuth users)
      return !this.googleId;
    },
    select: false 
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values but ensures uniqueness for non-null values
  },
  avatar: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0] // Default coordinates instead of required
    },
    address: {
      type: String,
      default: 'Location not set'
    }
  },
  booksOwned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  rating: {
    overallRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    starLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    breakdown: {
      communication: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      bookCondition: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      timeliness: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    },
    trustLevel: {
      type: String,
      enum: ['new', 'fair', 'good', 'very_good', 'excellent', 'needs_improvement'],
      default: 'new'
    },
    badges: [{
      type: String,
      title: String,
      description: String,
      icon: String,
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Security settings
  securitySettings: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    loginAlerts: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: String,
      enum: ['15', '30', '60', '120', 'never'],
      default: '30'
    },
    accountVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    twoFactorSecret: {
      type: String,
      select: false // Don't include in queries by default
    }
  },
  // Admin fields
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminNotes: {
    type: String,
    default: ''
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Ban and moderation fields
  banStatus: {
    isBanned: {
      type: Boolean,
      default: false
    },
    banUntil: {
      type: Date
    },
    reason: {
      type: String
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    banHistory: [{
      bannedAt: Date,
      banUntil: Date,
      reason: String,
      bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  deactivatedAt: {
    type: Date
  },
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deactivationReason: {
    type: String
  },
}, {
  timestamps: true
})

// Public key for end-to-end encryption (JWK format)
userSchema.add({
  publicKeyJwk: {
    type: Object,
    default: null
  }
})

userSchema.pre('save', async function(next) {
  // Only hash password if it exists and has been modified
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  // Return false if user doesn't have a password (OAuth users)
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

// Create indexes for performance optimization
userSchema.index({ location: '2dsphere' }); // Geospatial queries
userSchema.index({ email: 1 }); // Login queries
userSchema.index({ googleId: 1 }); // OAuth queries
userSchema.index({ 'rating.starLevel': -1 }); // Sorting by rating
userSchema.index({ lastActive: -1 }); // Admin dashboard queries
userSchema.index({ createdAt: -1 }); // Sorting by join date

const User = mongoose.model('User', userSchema)
export default User