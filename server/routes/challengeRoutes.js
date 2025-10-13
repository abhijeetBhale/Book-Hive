import express from 'express';
import {
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  leaveChallenge,
  getMyChallenges,
  getChallengeLeaderboard
} from '../controllers/challengeController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected routes that need to come first (to avoid conflicts with /:id)
router.get('/my-challenges', protect, getMyChallenges);

// Public routes
router.get('/', optionalAuth, getChallenges);
router.get('/:id', optionalAuth, getChallenge);
router.get('/:id/leaderboard', getChallengeLeaderboard);

// Protected routes
router.post('/', protect, createChallenge);

router.route('/:id')
  .put(protect, updateChallenge)
  .delete(protect, deleteChallenge);

router.post('/:id/join', protect, joinChallenge);
router.post('/:id/leave', protect, leaveChallenge);

export default router;