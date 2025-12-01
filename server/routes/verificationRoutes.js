import express from 'express';
import { 
  applyForVerification,
  getVerificationStatus
} from '../controllers/verificationController.js';
import { 
  getVerificationApplications,
  approveVerificationApplication,
  rejectVerificationApplication
} from '../controllers/verificationAdminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/apply', protect, applyForVerification);
router.get('/status', protect, getVerificationStatus);

// Admin routes for managing verification applications
router.get('/applications', protect, admin, getVerificationApplications);
router.put('/applications/:id/approve', protect, admin, approveVerificationApplication);
router.put('/applications/:id/reject', protect, admin, rejectVerificationApplication);

export default router;
