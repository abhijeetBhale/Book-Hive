import mongoose from 'mongoose';

const bookBroadcastSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookTitle: {
    type: String,
    required: true,
    trim: true
  },
  bookAuthor: {
    type: String,
    trim: true
  },
  bookCoverUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  durationNeeded: {
    type: Number, // in days
    required: true,
    min: 1,
    max: 365 // Allow up to 1 year
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active'
  },
  responses: [{
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }],
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fulfilledAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookBroadcastSchema.index({ status: 1, createdAt: -1 });
bookBroadcastSchema.index({ requester: 1 });
bookBroadcastSchema.index({ expiresAt: 1 });

const BookBroadcast = mongoose.model('BookBroadcast', bookBroadcastSchema);
export default BookBroadcast;
