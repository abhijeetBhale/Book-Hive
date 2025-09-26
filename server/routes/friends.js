import express from 'express';
import { protect } from '../middleware/auth.js';
import { sendFriendRequest, respondToFriendRequest, getFriendsAndRequests } from '../controllers/friendController.js';

const router = express.Router();

router.get('/', protect, getFriendsAndRequests);
router.post('/request/:userId', protect, sendFriendRequest);
router.put('/request/:requestId', protect, respondToFriendRequest);

export default router;



