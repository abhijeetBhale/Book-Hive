import Review from '../models/Review.js';
import BorrowRequest from '../models/BorrowRequest.js';
import User from '../models/User.js';

// Create a review after a borrow is returned
export const createReview = async (req, res) => {
  try {
    const { borrowRequestId, toUserId, rating, comment } = req.body;

    if (!borrowRequestId || !toUserId || !rating) {
      return res.status(400).json({ message: 'borrowRequestId, toUserId and rating are required' });
    }

    const br = await BorrowRequest.findById(borrowRequestId);
    if (!br) return res.status(404).json({ message: 'Borrow request not found' });

    const me = req.user._id.toString();
    if (br.borrower.toString() !== me && br.owner.toString() !== me) {
      return res.status(403).json({ message: 'Not a participant of this transaction' });
    }

    if (br.status !== 'returned') {
      return res.status(400).json({ message: 'Reviews can be left only after return' });
    }

    // Save review (unique constraint prevents duplicates per transaction and direction)
    const review = await Review.create({
      borrowRequest: borrowRequestId,
      fromUser: req.user._id,
      toUser: toUserId,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment: comment?.slice(0, 1000) || '',
    });

    // Recalculate recipient rating summary
    const agg = await Review.aggregate([
      { $match: { toUser: review.toUser } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    
    const reviewCount = agg[0]?.count || 0;
    const avgRating = agg[0]?.avg || 0;
    
    // Calculate star level based on review count
    // 10 reviews = 1 star, 20 = 2 stars, 30 = 3 stars, 40 = 4 stars, 50+ = 5 stars
    let starLevel = 0;
    if (reviewCount >= 50) starLevel = 5;
    else if (reviewCount >= 40) starLevel = 4;
    else if (reviewCount >= 30) starLevel = 3;
    else if (reviewCount >= 20) starLevel = 2;
    else if (reviewCount >= 10) starLevel = 1;
    
    await User.findByIdAndUpdate(review.toUser, {
      $set: { 
        'rating.overallRating': avgRating,
        'rating.totalRatings': reviewCount,
        'rating.reviewCount': reviewCount,
        'rating.starLevel': starLevel,
        'rating.lastUpdated': new Date()
      },
    });

    return res.status(201).json({ review });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this user for this transaction' });
    }
    console.error('createReview error:', err);
    return res.status(500).json({ message: 'Server error creating review' });
  }
};

export const listUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Review.find({ toUser: userId })
        .populate('fromUser', 'name avatar email')
        .populate('comments.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ toUser: userId }),
    ]);

    return res.json({ reviews: items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listUserReviews error:', err);
    return res.status(500).json({ message: 'Server error listing reviews' });
  }
};

export const getRatingsSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const agg = await Review.aggregate([
      { $match: { toUser: new User({ _id: userId })._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    return res.json({ average: agg[0]?.avg || 0, count: agg[0]?.count || 0 });
  } catch (err) {
    console.error('getRatingsSummary error:', err);
    return res.status(500).json({ message: 'Server error getting ratings summary' });
  }
};

// Like a review
export const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Check if user already liked
    const alreadyLiked = review.likes.some(like => like.user.toString() === userId.toString());
    
    if (alreadyLiked) {
      // Unlike
      review.likes = review.likes.filter(like => like.user.toString() !== userId.toString());
      review.likesCount = review.likes.length;
    } else {
      // Like
      review.likes.push({ user: userId, likedAt: new Date() });
      review.likesCount = review.likes.length;
    }

    await review.save();
    return res.json({ review, liked: !alreadyLiked });
  } catch (err) {
    console.error('likeReview error:', err);
    return res.status(500).json({ message: 'Server error liking review' });
  }
};

// Add comment to review
export const addComment = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.comments.push({
      user: userId,
      text: text.slice(0, 500),
      createdAt: new Date()
    });
    review.commentsCount = review.comments.length;

    await review.save();
    
    // Populate the new comment's user data
    await review.populate('comments.user', 'name avatar');
    
    return res.json({ review, comment: review.comments[review.comments.length - 1] });
  } catch (err) {
    console.error('addComment error:', err);
    return res.status(500).json({ message: 'Server error adding comment' });
  }
};

// Delete comment from review
export const deleteComment = async (req, res) => {
  try {
    const { reviewId, commentId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const comment = review.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Only comment owner can delete
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    review.comments.pull(commentId);
    review.commentsCount = review.comments.length;

    await review.save();
    return res.json({ review });
  } catch (err) {
    console.error('deleteComment error:', err);
    return res.status(500).json({ message: 'Server error deleting comment' });
  }
};

// Admin: Get all reviews with pagination and filters
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (rating) filter.rating = Number(rating);

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate('fromUser', 'name avatar email')
        .populate('toUser', 'name avatar email')
        .populate('borrowRequest', 'status')
        .populate('comments.user', 'name avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    return res.json({ 
      reviews: items, 
      total, 
      page: Number(page), 
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    console.error('getAllReviews error:', err);
    return res.status(500).json({ message: 'Server error listing reviews' });
  }
};

// Admin: Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Recalculate recipient rating after deletion
    await Review.findByIdAndDelete(reviewId);

    const agg = await Review.aggregate([
      { $match: { toUser: review.toUser } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const reviewCount = agg[0]?.count || 0;
    const avgRating = agg[0]?.avg || 0;

    let starLevel = 0;
    if (reviewCount >= 50) starLevel = 5;
    else if (reviewCount >= 40) starLevel = 4;
    else if (reviewCount >= 30) starLevel = 3;
    else if (reviewCount >= 20) starLevel = 2;
    else if (reviewCount >= 10) starLevel = 1;

    await User.findByIdAndUpdate(review.toUser, {
      $set: {
        'rating.overallRating': avgRating,
        'rating.totalRatings': reviewCount,
        'rating.reviewCount': reviewCount,
        'rating.starLevel': starLevel,
        'rating.lastUpdated': new Date()
      },
    });

    return res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ message: 'Server error deleting review' });
  }
};

// Admin: Get review statistics
export const getReviewStats = async (req, res) => {
  try {
    const [totalReviews, ratingDistribution, recentReviews] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Review.find()
        .populate('fromUser', 'name avatar')
        .populate('toUser', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const avgRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    return res.json({
      totalReviews,
      averageRating: avgRating[0]?.avg || 0,
      ratingDistribution,
      recentReviews
    });
  } catch (err) {
    console.error('getReviewStats error:', err);
    return res.status(500).json({ message: 'Server error getting review stats' });
  }
};
