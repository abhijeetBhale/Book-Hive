import express from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Create a new report
router.post('/', createReport);

// Get reports made by the current user
router.get('/my-reports', getMyReports);

export default router;