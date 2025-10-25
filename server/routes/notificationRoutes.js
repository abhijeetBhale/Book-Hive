import express from 'express';
import { 
  getUnreadNotifications, 
  markAsRead, 
  markAllAsRead,
  getModerationNotifications 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get unread notifications
router.get('/unread', getUnreadNotifications);

// Get moderation-specific notifications
router.get('/moderation', getModerationNotifications);

// Mark specific notifications as read
router.put('/mark-read', markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

export default router;