import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  isbn: {
    type: String,
    trim: true,
  },
  publicationYear: {
    type: Number,
    min: [1800, 'Publication year must be after 1800'],
    max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future'],
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
  },
  coverImage: {
    type: String,
    required: false // Or true, depending on your requirements
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  forBorrowing: {
    type: Boolean,
    default: true
  },
  // Booking fields
  isBooked: { type: Boolean, default: false },
  bookedFrom: { type: Date, default: null },
  bookedUntil: { type: Date, default: null },
  currentBorrowRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest', default: null },
}, {
  timestamps: true
})

const Book = mongoose.model('Book', bookSchema)
export default Book
