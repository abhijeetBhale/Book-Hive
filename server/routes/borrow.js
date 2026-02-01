import express from 'express';
import { 
  requestBook, 
  acceptRequest, 
  returnBook, 
  getReceivedRequests, 
  getMyRequests, 
  updateRequestStatus,
  markAsBorrowed,
  markAsReturned,
  deleteRequest,
  getAllBorrowRequests,
  getBookHistory,
  testReminders,
  reportDamage,
  respondToDamageReport,
  getDamageReports,
  getDamageReportById
} from '../controllers/borrowController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/request/:bookId', protect, requestBook);
router.get('/received-requests', protect, getReceivedRequests);
router.get('/my-requests', protect, getMyRequests);
router.get('/all-requests', protect, getAllBorrowRequests);
router.get('/history', protect, getBookHistory);
router.post('/test-reminders', protect, testReminders);
router.put('/:requestId', protect, updateRequestStatus);
router.put('/:requestId/borrowed', protect, markAsBorrowed);
router.put('/:requestId/returned', protect, markAsReturned);
router.delete('/:requestId', protect, deleteRequest);
router.put('/:requestId/return', protect, returnBook);
router.put('/accept/:requestId', protect, acceptRequest);

// Damage reporting routes
router.post('/:requestId/damage-report', protect, upload.array('images', 5), reportDamage);
router.put('/damage-reports/:reportId/respond', protect, respondToDamageReport);
router.get('/damage-reports', protect, getDamageReports);
router.get('/damage-reports/:reportId', protect, getDamageReportById);

export default router;
