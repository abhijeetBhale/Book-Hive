import express from 'express';
import {
  getWalletDetails,
  getTransactionHistory,
  requestWithdrawal,
  getPlatformWalletSummary,
  getWithdrawalRequests,
  processWithdrawalRequest,
  getEarningsSummary,
  getAllTransactions,
  getUserWallets,
  adjustUserBalance,
  getWalletAnalytics
} from '../controllers/walletController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// User wallet routes
router.get('/', protect, getWalletDetails);
router.get('/transactions', protect, getTransactionHistory);
router.get('/earnings', protect, getEarningsSummary);
router.post('/withdraw', protect, requestWithdrawal);

// Admin wallet routes
router.get('/platform-summary', protect, admin, getPlatformWalletSummary);
router.get('/withdrawal-requests', protect, admin, getWithdrawalRequests);
router.put('/withdrawal-requests/:id', protect, admin, processWithdrawalRequest);

// Enhanced admin routes
router.get('/admin/all-transactions', protect, admin, getAllTransactions);
router.get('/admin/user-wallets', protect, admin, getUserWallets);
router.post('/admin/adjust-balance', protect, admin, adjustUserBalance);
router.get('/admin/analytics', protect, admin, getWalletAnalytics);

export default router;