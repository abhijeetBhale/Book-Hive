import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createBookInquiry,
  listBookInquiries,
  getAllNotifications,
  getUnreadCount,
  markRead,
  createTestNotification,
  deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Create a book inquiry notification (profile -> send message)
router.post('/book-inquiry', protect, createBookInquiry);

// List book inquiry notifications for current user
router.get('/book-inquiry', protect, listBookInquiries);

// Get all notifications for current user
router.get('/', protect, getAllNotifications);

// Get unread notification count
router.get('/count', protect, getUnreadCount);

// Mark notifications as read
router.put('/mark-read', protect, markRead);

// Create test notification (for development)
router.post('/test', protect, createTestNotification);

// Delete a notification (only owner)
router.delete('/:id', protect, deleteNotification);

export default router;
