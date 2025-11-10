import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { 
  createReview, 
  listUserReviews, 
  getRatingsSummary,
  likeReview,
  addComment,
  deleteComment,
  getAllReviews,
  deleteReview,
  getReviewStats
} from '../controllers/reviewController.js';

const router = express.Router();

// Public and user routes
router.post('/', protect, createReview);
router.get('/user/:userId', listUserReviews); // public list of reviews for a user
router.get('/user/:userId/summary', getRatingsSummary);
router.post('/:reviewId/like', protect, likeReview);
router.post('/:reviewId/comment', protect, addComment);
router.delete('/:reviewId/comment/:commentId', protect, deleteComment);

// Admin routes
router.get('/admin/all', protect, admin, getAllReviews);
router.get('/admin/stats', protect, admin, getReviewStats);
router.delete('/admin/:reviewId', protect, admin, deleteReview);

export default router;
