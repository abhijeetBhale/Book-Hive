import express from 'express';
import {
  searchBooksFromAPIs,
  searchBookByISBN,
  getBookCovers,
  validateImageUrl,
  getExternalBookDetails
} from '../controllers/bookSearchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Search books from multiple APIs
router.get('/search', searchBooksFromAPIs);

// Search book by ISBN from multiple APIs
router.get('/search/isbn/:isbn', searchBookByISBN);

// Get multiple cover options for a book
router.post('/covers', getBookCovers);

// Validate image URL
router.post('/validate-image', validateImageUrl);

// Get book details from external API
router.get('/external/:source/:id', getExternalBookDetails);

export default router;