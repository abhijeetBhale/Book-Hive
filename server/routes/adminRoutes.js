import express from 'express';
import {
  getDashboardOverview,
  getUsers,
  getUserDetails,
  updateUser,
  getBooks,
  getBooksForSale,
  deleteBook,
  getAnalytics,
  getBorrowRequests,
  updateBorrowRequest,
  getBookClubs,
  updateBookClub,
  deleteBookClub,
  getReports,
  updateReport,
  getBookSharingActivity,
  getTopCategoriesData
} from '../controllers/adminController.js';
import { superAdminAuth, auditLogger } from '../middleware/adminAuth.js';

const router = express.Router();

// Test route (no auth required for testing)
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working!' });
});

// All routes require super admin authentication
router.use(superAdminAuth);

// Dashboard routes
router.get('/dashboard', auditLogger('VIEW_DASHBOARD'), getDashboardOverview);
router.get('/analytics', auditLogger('VIEW_ANALYTICS'), getAnalytics);
router.get('/book-sharing-activity', auditLogger('VIEW_BOOK_SHARING_ACTIVITY'), getBookSharingActivity);
router.get('/top-categories', auditLogger('VIEW_TOP_CATEGORIES'), getTopCategoriesData);

// User management routes
router.get('/users', auditLogger('VIEW_USERS'), getUsers);
router.get('/users/:id', auditLogger('VIEW_USER_DETAILS'), getUserDetails);
router.put('/users/:id', auditLogger('UPDATE_USER'), updateUser);

// Book management routes
router.get('/books', auditLogger('VIEW_BOOKS'), getBooks);
router.get('/books-for-sale', auditLogger('VIEW_BOOKS_FOR_SALE'), getBooksForSale);
router.delete('/books/:id', auditLogger('DELETE_BOOK'), deleteBook);

// Borrow requests management routes
router.get('/borrow-requests', auditLogger('VIEW_BORROW_REQUESTS'), getBorrowRequests);
router.put('/borrow-requests/:id', auditLogger('UPDATE_BORROW_REQUEST'), updateBorrowRequest);

// Book clubs management routes
router.get('/book-clubs', auditLogger('VIEW_BOOK_CLUBS'), getBookClubs);
router.put('/book-clubs/:id', auditLogger('UPDATE_BOOK_CLUB'), updateBookClub);
router.delete('/book-clubs/:id', auditLogger('DELETE_BOOK_CLUB'), deleteBookClub);

// Reports management routes
router.get('/reports', auditLogger('VIEW_REPORTS'), getReports);
router.put('/reports/:id', auditLogger('UPDATE_REPORT'), updateReport);

export default router;