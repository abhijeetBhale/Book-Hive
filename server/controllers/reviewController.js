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
    await User.findByIdAndUpdate(review.toUser, {
      $set: { 'rating.value': agg[0]?.avg || 0, 'rating.count': agg[0]?.count || 0 },
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
