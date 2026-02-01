import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    index: true, // Add index for faster search
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    index: true, // Add index for faster search
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true, // Add index for filtering
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  isbn: {
    type: String,
    trim: true,
    index: true, // Add index for ISBN search
  },
  publicationYear: {
    type: Number,
    min: [1800, 'Publication year must be after 1800'],
    max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future'],
    index: true, // Add index for year filtering
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'worn'],
    required: [true, 'Book condition is required'],
    index: true, // Add index for condition filtering
  },
  // Track condition changes over time
  conditionHistory: [{
    condition: {
      type: String,
      enum: ['new', 'good', 'worn'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  language: {
    type: String,
    default: 'English',
    index: true, // Add index for language filtering
  },
  genre: {
    type: [String], // Array of genres for multi-genre books
    default: [],
    index: true,
  },
  tags: {
    type: [String], // User-defined tags
    default: [],
    index: true,
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  coverImage: {
    type: String,
    required: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Add index for owner queries
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true, // Add index for availability filtering
  },
  forBorrowing: {
    type: Boolean,
    default: true,
    index: true, // Add index for borrowing filtering
  },
  // Lending duration (in days)
  lendingDuration: {
    type: Number,
    min: 1,
    max: 365,
    default: 14, // Default 14 days
  },
  // Security Deposit
  securityDeposit: {
    type: Number,
    min: 0,
    default: 0, // 0 means no deposit required
  },
  // Lending Fee (amount owner charges for lending the book)
  lendingFee: {
    type: Number,
    min: 0,
    default: 0, // 0 means free lending
  },
  // Selling options
  forSelling: {
    type: Boolean,
    default: false,
    index: true, // Add index for selling filtering
  },
  sellingPrice: {
    type: Number,
    min: 0,
    default: null,
  },
  marketPrice: {
    type: Number,
    min: 0,
    default: null,
  },
  priceValidation: {
    isValidated: { type: Boolean, default: false },
    validatedAt: { type: Date },
    marketSources: [String], // Sources used for price validation
    priceComparison: {
      userPrice: Number,
      marketPrice: Number,
      percentageDifference: Number,
      isReasonable: Boolean, // true if user price is <= market price
    }
  },
  // Enhanced search fields
  searchText: {
    type: String,
    index: 'text', // Full-text search index
  },
  // Booking fields
  isBooked: { type: Boolean, default: false },
  bookedFrom: { type: Date, default: null },
  bookedUntil: { type: Date, default: null },
  currentBorrowRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest', default: null },
  // Analytics fields
  viewCount: { type: Number, default: 0 },
  borrowCount: { type: Number, default: 0 },
  lastBorrowed: { type: Date },
  // Auto re-listing fields
  lastReturnedAt: { type: Date },
  timesLent: { type: Number, default: 0 },
  autoRelist: { type: Boolean, default: true }, // Owner preference for auto re-listing
  unavailableReason: { 
    type: String, 
    enum: ['pending_damage_report', 'owner_disabled', 'maintenance'],
    sparse: true 
  },
}, {
  timestamps: true
})

// Create compound indexes for common queries
bookSchema.index({ title: 1, author: 1 });
bookSchema.index({ category: 1, isAvailable: 1 });
bookSchema.index({ owner: 1, isAvailable: 1 });
bookSchema.index({ createdAt: -1 }); // For sorting by newest

// Pre-save middleware to update searchText field and track condition changes
bookSchema.pre('save', async function(next) {
  this.searchText = `${this.title} ${this.author} ${this.description} ${this.category} ${this.genre.join(' ')} ${this.tags.join(' ')}`.toLowerCase();
  
  // Track condition changes
  if (this.isModified('condition') && !this.isNew) {
    // Check if book has active borrow request
    const BorrowRequest = mongoose.model('BorrowRequest');
    const activeBorrow = await BorrowRequest.findOne({
      book: this._id,
      status: { $in: ['approved', 'borrowed'] }
    });
    
    if (activeBorrow) {
      const error = new Error('Cannot change book condition while it is actively borrowed');
      error.name = 'ValidationError';
      return next(error);
    }
    
    // Add to condition history
    this.conditionHistory.push({
      condition: this.condition,
      changedAt: new Date(),
      changedBy: this.owner,
      notes: 'Condition updated by owner'
    });
  }
  
  // Initialize condition history for new books
  if (this.isNew && this.condition) {
    this.conditionHistory = [{
      condition: this.condition,
      changedAt: new Date(),
      changedBy: this.owner,
      notes: 'Initial condition set during book creation'
    }];
  }
  
  next();
});

const Book = mongoose.model('Book', bookSchema)
export default Book
