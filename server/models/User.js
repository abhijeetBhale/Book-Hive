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
    value: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
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

// Create a geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema)
export default User