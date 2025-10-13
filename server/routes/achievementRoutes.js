import express from 'express';
import {
  getAchievements,
  getMyAchievements,
  getAchievementLeaderboard,
  getUserStats,
  createAchievement,
  updateAchievement,
  deleteAchievement
} from '../controllers/achievementController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAchievements);
router.get('/leaderboard', getAchievementLeaderboard);
router.get('/stats/:userId', optionalAuth, getUserStats);
router.get('/stats', optionalAuth, getUserStats);

// Protected routes
router.get('/my-achievements', protect, getMyAchievements);

// Admin routes
router.post('/', protect, createAchievement);
router.route('/:id')
  .put(protect, updateAchievement)
  .delete(protect, deleteAchievement);

export default router;