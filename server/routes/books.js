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
  getFilterOptions
} from '../controllers/bookController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
const router = express.Router();

// Main routes
router.route('/').get(getAllBooks).post(protect, upload.single('coverImage'), createBook);

// Search and filter routes
router.get('/search/isbn/:isbn', searchByISBN);
router.get('/suggestions', protect, getBookSuggestions);
router.get('/trending', getTrendingBooks);
router.get('/filters', getFilterOptions);

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