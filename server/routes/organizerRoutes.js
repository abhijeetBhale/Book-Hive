import express from 'express';
import { 
  getOrganizerEvents,
  getOrganizerEventsForMap,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrants,
  exportRegistrants,
  updateRegistrantStatus,
  applyAsOrganizer,
  getOrganizerStats
} from '../controllers/organizerController.js';
import { 
  getOrganizerApplications,
  approveOrganizerApplication,
  rejectOrganizerApplication
} from '../controllers/organizerAdminController.js';
import { protect, requireOrganizer, admin } from '../middleware/auth.js';

const router = express.Router();

// Application route (any authenticated user can apply)
router.post('/apply', protect, applyAsOrganizer);

// Organizer-only routes
router.get('/events', protect, requireOrganizer, getOrganizerEvents);
router.get('/events/map', protect, requireOrganizer, getOrganizerEventsForMap);
router.get('/stats', protect, requireOrganizer, getOrganizerStats);
router.post('/events', protect, requireOrganizer, createEvent);
router.put('/events/:id', protect, requireOrganizer, updateEvent);
router.delete('/events/:id', protect, requireOrganizer, deleteEvent);
router.get('/events/:id/registrants', protect, requireOrganizer, getEventRegistrants);
router.get('/events/:id/export', protect, requireOrganizer, exportRegistrants);
router.put('/events/:eventId/registrants/:registrationId', protect, requireOrganizer, updateRegistrantStatus);

// Admin routes for managing organizer applications
router.get('/applications', protect, admin, getOrganizerApplications);
router.put('/applications/:id/approve', protect, admin, approveOrganizerApplication);
router.put('/applications/:id/reject', protect, admin, rejectOrganizerApplication);

export default router;
