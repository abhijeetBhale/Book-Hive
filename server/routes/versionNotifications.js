import express from 'express';
import {
  getUnviewedNotifications,
  getNotificationById,
  markNotificationAsViewed,
  createVersionNotification,
  getAllNotifications,
  updateNotification,
  deleteNotification
} from '../controllers/versionNotificationController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (require authentication)
router.get('/unviewed', protect, getUnviewedNotifications);
router.get('/:id', protect, getNotificationById);
router.post('/:id/view', protect, markNotificationAsViewed);

// Admin routes
router.post('/', protect, admin, createVersionNotification);
router.get('/admin/all', protect, admin, getAllNotifications);
router.put('/:id', protect, admin, updateNotification);
router.delete('/:id', protect, admin, deleteNotification);

export default router;