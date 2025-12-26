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
      type: [Number], // [longitude, latitude] - ORIGINAL coordinates for distance calculations
      default: [0, 0] // Default coordinates instead of required
    },
    displayCoordinates: {
      type: [Number], // [longitude, latitude] - OFFSET coordinates for map display (privacy)
      default: undefined // Will be generated when location is set
    },
    address: {
      type: String,
      default: 'Location not set'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
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
  // Contact Verification (Free)
  contactVerification: {
    email: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: {
        type: Date
      },
      verificationToken: {
        type: String,
        select: false
      },
      tokenExpiry: {
        type: Date,
        select: false
      }
    }
  },
  // Premium Verification Badge (Paid)
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationPurchaseDate: {
    type: Date
  },
  verificationPaymentId: {
    type: String
  },
  // Premium Features
  premiumFeatures: {
    searchBoost: {
      type: Boolean,
      default: false
    },
    priorityQueue: {
      type: Boolean,
      default: false
    },
    multipleBooks: {
      type: Boolean,
      default: false
    },
    maxBooksLimit: {
      type: Number,
      default: 1 // Free users can borrow 1 book at a time
    },
    earlyAccess: {
      type: Boolean,
      default: false
    }
  },
  // Admin fields
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin', 'superadmin'],
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: false
  },
  isOrganizer: {
    type: Boolean,
    default: false
  },
  organizerProfile: {
    organizationName: {
      type: String,
      default: ''
    },
    organizationType: {
      type: String,
      enum: ['community', 'library', 'bookstore', 'educational', 'other', ''],
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    verificationDocuments: [{
      type: String
    }],
    approvedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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
  // Blocked users for chat safety
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Wishlist and reading preferences
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recentlyViewed: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readingPreferences: {
    favoriteGenres: [{
      type: String,
      trim: true
    }],
    favoriteAuthors: [{
      type: String,
      trim: true
    }],
    readingGoals: {
      booksPerMonth: {
        type: Number,
        default: 0,
        min: 0
      },
      currentStreak: {
        type: Number,
        default: 0,
        min: 0
      },
      longestStreak: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    preferredLanguages: [{
      type: String,
      default: ['English']
    }],
    bookFormats: [{
      type: String,
      enum: ['physical', 'ebook', 'audiobook'],
      default: 'physical'
    }],
    maxDistance: {
      type: Number,
      default: 10, // kilometers
      min: 1,
      max: 100
    }
  },
  // User statistics for impact metrics
  statistics: {
    booksShared: {
      type: Number,
      default: 0
    },
    booksReceived: {
      type: Number,
      default: 0
    },
    totalBorrowRequests: {
      type: Number,
      default: 0
    },
    successfulBorrows: {
      type: Number,
      default: 0
    },
    communityImpact: {
      carbonFootprintSaved: {
        type: Number,
        default: 0 // in kg CO2
      },
      moneySaved: {
        type: Number,
        default: 0 // estimated money saved by borrowing vs buying
      },
      booksKeptInCirculation: {
        type: Number,
        default: 0
      }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  // Wallet and Earnings
  wallet: {
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    withdrawnAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['lending_fee', 'withdrawal', 'refund'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      borrowRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BorrowRequest'
      },
      description: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
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
// Note: email and googleId already have unique indexes from schema definition
userSchema.index({ 'rating.starLevel': -1 }); // Sorting by rating
userSchema.index({ lastActive: -1 }); // Admin dashboard queries
userSchema.index({ createdAt: -1 }); // Sorting by join date
userSchema.index({ isActive: 1 }); // Filter active users
userSchema.index({ name: 'text', email: 'text' }); // Text search
userSchema.index({ 'rating.overallRating': -1 }); // Rating queries
userSchema.index({ 'wishlist': 1 }); // Wishlist queries
userSchema.index({ 'recentlyViewed.viewedAt': -1 }); // Recently viewed sorting
userSchema.index({ 'readingPreferences.favoriteGenres': 1 }); // Genre preferences

const User = mongoose.model('User', userSchema)
export default User