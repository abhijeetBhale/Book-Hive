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

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of books per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search books by title or author
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - category
 *               - condition
 *             properties:
 *               title:
 *                 type: string
 *                 example: "The Great Gatsby"
 *               author:
 *                 type: string
 *                 example: "F. Scott Fitzgerald"
 *               description:
 *                 type: string
 *                 example: "A classic American novel"
 *               category:
 *                 type: string
 *                 example: "Fiction"
 *               condition:
 *                 type: string
 *                 enum: [New, Like New, Good, Fair, Poor]
 *                 example: "Good"
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Book cover image
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Book created successfully"
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.route('/').get(getAllBooks).post(protect, upload.single('coverImage'), createBook);

// Search and filter routes
router.get('/search/isbn/:isbn', searchByISBN);
router.get('/suggestions', protect, getBookSuggestions);
router.get('/recommendations', protect, getPersonalizedRecommendations);
/**
 * @swagger
 * /api/books/trending:
 *   get:
 *     summary: Get trending books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Trending books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 */
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