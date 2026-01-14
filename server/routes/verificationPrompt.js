import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getVerificationPromptStatus,
  markFloatingPopupSeen,
  dismissPermanently,
  markProfileSetupCompleted,
  resetFloatingPopupFlag
} from '../controllers/verificationPromptController.js';

const router = express.Router();

// All routes are protected (require authentication)
router.get('/status', protect, getVerificationPromptStatus);
router.post('/seen', protect, markFloatingPopupSeen);
router.post('/dismiss-permanently', protect, dismissPermanently);
router.post('/profile-setup-completed', protect, markProfileSetupCompleted);
router.post('/reset-popup', protect, resetFloatingPopupFlag);

export default router;