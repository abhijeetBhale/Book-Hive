import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    borrowRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest', required: true, index: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now }
    }],
    likesCount: { type: Number, default: 0 },
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true, maxlength: 500 },
      createdAt: { type: Date, default: Date.now }
    }],
    commentsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

reviewSchema.index({ fromUser: 1, toUser: 1, borrowRequest: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
