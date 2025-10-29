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
  testReminders
} from '../controllers/borrowController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/request/:bookId', protect, requestBook);
router.get('/received-requests', protect, getReceivedRequests);
router.get('/my-requests', protect, getMyRequests);
router.get('/all-requests', protect, getAllBorrowRequests);
router.post('/test-reminders', protect, testReminders);
router.put('/:requestId', protect, updateRequestStatus);
router.put('/:requestId/borrowed', protect, markAsBorrowed);
router.put('/:requestId/returned', protect, markAsReturned);
router.delete('/:requestId', protect, deleteRequest);
router.put('/:requestId/return', protect, returnBook);
router.put('/accept/:requestId', protect, acceptRequest);

export default router;
