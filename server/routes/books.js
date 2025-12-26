import express from 'express';
import { 
  getAllBooks, 
  getBookById, 
  createBook, 
  updateBook, 
  deleteBook, 
  getUserBooks, 
  getMyBooks,
  searchByISBN,
  getBookSuggestions,
  getTrendingBooks,
  getFilterOptions,
  validateBookPrice,
  getBooksForSale,
  getEnhancedFilters,
  getPersonalizedRecommendations
} from '../controllers/bookController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
const router = express.Router();

// Main routes
router.route('/').get(getAllBooks).post(protect, upload.single('coverImage'), createBook);

// Search and filter routes
router.get('/search/isbn/:isbn', searchByISBN);
router.get('/suggestions', protect, getBookSuggestions);
router.get('/recommendations', protect, getPersonalizedRecommendations);
router.get('/trending', getTrendingBooks);
router.get('/filters', getFilterOptions);
router.get('/enhanced-filters', getEnhancedFilters);
router.get('/for-sale', getBooksForSale);
router.post('/validate-price', protect, validateBookPrice);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Books API is working', timestamp: new Date().toISOString() });
});

// User-specific routes
router.get('/my-books', protect, getMyBooks);
router.get('/user/:userId', getUserBooks);

// Individual book routes
router.route('/:id').get(getBookById).put(protect, upload.single('coverImage'), updateBook).delete(protect, deleteBook);

export default router;