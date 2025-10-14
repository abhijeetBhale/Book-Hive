import express from 'express';
import {
  getDashboardOverview,
  getUsers,
  getUserDetails,
  updateUser,
  getBooks,
  deleteBook,
  getAnalytics,
  getBorrowRequests,
  updateBorrowRequest,
  getBookClubs,
  updateBookClub,
  deleteBookClub,
  getReports,
  updateReport
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
router.get('/dashboard-simple', auditLogger('VIEW_DASHBOARD_SIMPLE'), (req, res) => {
  res.json({
    status: 'success',
    data: {
      overview: {
        totalUsers: 0,
        totalBooks: 0,
        totalBorrowRequests: 0,
        totalClubs: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        newBooksThisMonth: 0,
        activeBorrowRequests: 0,
        completedBorrowRequests: 0,
        userGrowthRate: 0,
        bookGrowthRate: 0
      },
      recentActivity: {
        recentUsers: [],
        recentBooks: []
      },
      systemStats: {
        dailyActiveUsers: 0,
        dailyNewUsers: 0,
        dailyNewBooks: 0,
        dailyBorrowRequests: 0
      }
    }
  });
});
router.get('/analytics', auditLogger('VIEW_ANALYTICS'), getAnalytics);

// User management routes
router.get('/users', auditLogger('VIEW_USERS'), getUsers);
router.get('/users/:id', auditLogger('VIEW_USER_DETAILS'), getUserDetails);
router.put('/users/:id', auditLogger('UPDATE_USER'), updateUser);

// Book management routes
router.get('/books', auditLogger('VIEW_BOOKS'), getBooks);
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