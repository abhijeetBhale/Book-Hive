import express from 'express';
import { 
  getPublicEvents, 
  getEventById, 
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  cancelEvent,
  deleteEvent,
  getAllEventsAdmin
} from '../controllers/eventController.js';
import { protect, optionalAuth, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, getPublicEvents);
router.get('/my-registrations', protect, getMyRegistrations);
router.get('/:id', optionalAuth, getEventById);

// Protected routes
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);

// Admin routes
router.get('/admin/all', protect, admin, getAllEventsAdmin);
router.put('/:id/cancel', protect, admin, cancelEvent);
router.delete('/:id', protect, admin, deleteEvent);

export default router;
