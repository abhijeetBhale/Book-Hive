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
    enum: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
    index: true, // Add index for condition filtering
  },
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
}, {
  timestamps: true
})

// Create compound indexes for common queries
bookSchema.index({ title: 1, author: 1 });
bookSchema.index({ category: 1, isAvailable: 1 });
bookSchema.index({ owner: 1, isAvailable: 1 });
bookSchema.index({ createdAt: -1 }); // For sorting by newest

// Pre-save middleware to update searchText field
bookSchema.pre('save', function(next) {
  this.searchText = `${this.title} ${this.author} ${this.description} ${this.category} ${this.genre.join(' ')} ${this.tags.join(' ')}`.toLowerCase();
  next();
});

const Book = mongoose.model('Book', bookSchema)
export default Book
