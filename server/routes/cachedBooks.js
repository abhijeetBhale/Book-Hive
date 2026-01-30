import express from 'express';
import * as originalBookController from '../controllers/bookController.js';
import CachedBookController from '../controllers/cachedBookController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import rateLimiter from '../middleware/rateLimiter.js';
import cacheService from '../services/cacheService.js';

const router = express.Router();

// Create cached controller instance
const cachedController = new CachedBookController(originalBookController);

// Apply rate limiting to different endpoints
const searchLimiter = rateLimiter.searchLimiter();
const generalLimiter = rateLimiter.generalLimiter();
const uploadLimiter = rateLimiter.uploadLimiter();

// Main routes with caching and rate limiting
router.route('/')
  .get(generalLimiter, cachedController.getAllBooks)
  .post(protect, uploadLimiter, upload.single('coverImage'), cachedController.createBook);

// Search and filter routes with caching
router.get('/search/isbn/:isbn', searchLimiter, originalBookController.searchByISBN);
router.get('/suggestions', protect, generalLimiter, cachedController.getBookSuggestions);
router.get('/recommendations', protect, generalLimiter, originalBookController.getPersonalizedRecommendations);
router.get('/trending', generalLimiter, cachedController.getTrendingBooks);
router.get('/filters', generalLimiter, cachedController.getFilterOptions);
router.get('/enhanced-filters', generalLimiter, originalBookController.getEnhancedFilters);
router.get('/for-sale', generalLimiter, originalBookController.getBooksForSale);
router.post('/validate-price', protect, generalLimiter, originalBookController.validateBookPrice);

// Nearby books with geospatial caching
router.get('/nearby', generalLimiter, cachedController.getNearbyBooks);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Cached Books API is working', 
    timestamp: new Date().toISOString(),
    redis: 'enabled'
  });
});

// User-specific routes (no caching for personalized data)
router.get('/my-books', protect, generalLimiter, originalBookController.getMyBooks);
router.get('/user/:userId', generalLimiter, originalBookController.getUserBooks);

// Individual book routes with caching
router.route('/:id')
  .get(generalLimiter, cachedController.getBookById)
  .put(protect, uploadLimiter, upload.single('coverImage'), cachedController.updateBook)
  .delete(protect, generalLimiter, cachedController.deleteBook);

// Cache management routes (admin only)
router.post('/cache/invalidate', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { bookId, type = 'all' } = req.body;

    if (type === 'all') {
      await cachedController.invalidateBookCaches();
      res.json({ message: 'All book caches invalidated' });
    } else if (bookId) {
      await cachedController.invalidateBookCaches(bookId);
      res.json({ message: `Cache invalidated for book ${bookId}` });
    } else {
      res.status(400).json({ message: 'Invalid cache invalidation request' });
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({ message: 'Error invalidating cache' });
  }
});

// Cache health check
router.get('/cache/health', async (req, res) => {
  try {
    const healthStatus = await cacheService.getHealthStatus();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({ 
      connected: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;