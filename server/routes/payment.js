import express from 'express';
import { 
  createVerificationOrder, 
  verifyPayment, 
  getVerificationStatus 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get verification status
router.get('/verification-status', getVerificationStatus);

// Create verification order
router.post('/create-verification-order', createVerificationOrder);

// Verify payment
router.post('/verify-payment', verifyPayment);

export default router;
