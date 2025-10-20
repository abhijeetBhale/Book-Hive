import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createBookInquiry,
  listBookInquiries,
  getAllNotifications,
  getUnreadCount,
  markRead,
  createTestNotification,
  deleteNotification,
  getNotificationsByType,
  getNotificationStats,
  markAllAsRead,
  clearReadNotifications,
  updateNotificationPreferences
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

// Get notification statistics
router.get('/stats', protect, getNotificationStats);

// Get notifications by type
router.get('/type/:type', protect, getNotificationsByType);

// Mark notifications as read
router.put('/mark-read', protect, markRead);

// Mark all notifications as read
router.put('/mark-all-read', protect, markAllAsRead);

// Update notification preferences
router.put('/preferences', protect, updateNotificationPreferences);

// Create test notification (for development)
router.post('/test', protect, createTestNotification);

// Delete a notification (only owner)
router.delete('/:id', protect, deleteNotification);

// Clear all read notifications
router.delete('/clear-read', protect, clearReadNotifications);

export default router;
