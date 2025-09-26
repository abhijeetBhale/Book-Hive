import express from 'express';
import {
  createTestimonial,
  getPublishedTestimonials,
  getUserTestimonial,
  updateUserTestimonial,
  deleteUserTestimonial
} from '../controllers/testimonialController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPublishedTestimonials);

// Protected routes
router.post('/', protect, createTestimonial);
router.get('/my-testimonial', protect, getUserTestimonial);
router.put('/my-testimonial', protect, updateUserTestimonial);
router.delete('/my-testimonial', protect, deleteUserTestimonial);

export default router;