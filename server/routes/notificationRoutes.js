import express from 'express';
import { 
  getUnreadNotifications, 
  markAsRead, 
  markAllAsRead,
  getModerationNotifications,
  getAllNotifications,
  getUnreadCount,
  markRead,
  createTestNotification,
  deleteNotification,
  getNotificationsByType,
  getNotificationStats,
  clearReadNotifications,
  updateNotificationPreferences,
  createBookInquiry,
  listBookInquiries
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all notifications
router.get('/', getAllNotifications);

// Get unread notifications
router.get('/unread', getUnreadNotifications);

// Get unread count
router.get('/count', getUnreadCount);

// Get notification stats
router.get('/stats', getNotificationStats);

// Get notifications by type
router.get('/type/:type', getNotificationsByType);

// Get moderation-specific notifications
router.get('/moderation', getModerationNotifications);

// Get book inquiry notifications
router.get('/book-inquiry', listBookInquiries);

// Create book inquiry notification
router.post('/book-inquiry', createBookInquiry);

// Create test notification (for development/testing)
router.post('/test', createTestNotification);

// Mark specific notifications as read
router.put('/mark-read', markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Update notification preferences
router.put('/preferences', updateNotificationPreferences);

// Clear read notifications
router.delete('/clear-read', clearReadNotifications);

// Delete specific notification
router.delete('/:id', deleteNotification);

export default router;