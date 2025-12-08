import express from 'express';
import {
  createBroadcast,
  getAllBroadcasts,
  getMyBroadcasts,
  respondToBroadcast,
  confirmResponder,
  cancelBroadcast
} from '../controllers/broadcastController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createBroadcast);
router.get('/', protect, getAllBroadcasts);
router.get('/my-broadcasts', protect, getMyBroadcasts);
router.post('/:broadcastId/respond', protect, respondToBroadcast);
router.post('/:broadcastId/confirm/:responderId', protect, confirmResponder);
router.delete('/:broadcastId', protect, cancelBroadcast);

export default router;
