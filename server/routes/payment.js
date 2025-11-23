import express from 'express';
import {
  createVerificationOrder,
  verifyPayment,
  getVerificationStatus,
  createDepositOrder,
  verifyDepositPayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', protect, createVerificationOrder); // Assuming createOrder maps to createVerificationOrder
router.post('/verify-payment', protect, verifyPayment);
router.get('/verification-status', protect, getVerificationStatus);

// Security Deposit Routes
router.post('/create-deposit-order', protect, createDepositOrder);
router.post('/verify-deposit-payment', protect, verifyDepositPayment);

export default router;
