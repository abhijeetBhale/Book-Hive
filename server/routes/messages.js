import express from 'express';
import { sendMessage, getConversations, getConversationWithUser, getReceivedMessages, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// This route gets all conversations for the logged-in user
router.get('/conversations', protect, getConversations);
router.get('/with/:userId', protect, getConversationWithUser);

// This route gets received messages for notifications
router.get('/received', protect, getReceivedMessages);

// This route sends a message to a specific user
router.post('/send/:recipientId', protect, sendMessage);

// This route deletes a message
router.delete('/:messageId', protect, deleteMessage);

export default router;