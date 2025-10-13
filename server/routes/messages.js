import express from 'express';
import {
  sendMessage,
  sendFileMessage,
  getConversations,
  getConversationWithUser,
  getReceivedMessages,
  deleteMessage,
  clearConversation,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// This route gets all conversations for the logged-in user
router.get('/conversations', protect, getConversations);
router.get('/with/:userId', protect, getConversationWithUser);

// This route gets received messages for notifications
router.get('/received', protect, getReceivedMessages);

// This route sends a message to a specific user
router.post('/send/:recipientId', protect, sendMessage);

// This route sends a file message to a specific user
router.post('/send-file/:recipientId', protect, upload.single('file'), sendFileMessage);

// This route deletes a message
router.delete('/:messageId', protect, deleteMessage);

// This route clears an entire conversation
router.delete('/conversation/:conversationId', protect, clearConversation);

export default router;