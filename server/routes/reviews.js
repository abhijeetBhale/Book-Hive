import express from 'express';
import { protect } from '../middleware/auth.js';
import { createReview, listUserReviews, getRatingsSummary } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/user/:userId', listUserReviews); // public list of reviews for a user
router.get('/user/:userId/summary', getRatingsSummary);

export default router;
