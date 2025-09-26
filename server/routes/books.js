import express from 'express';
import { getAllBooks, getBookById, createBook, updateBook, deleteBook, getUserBooks, getMyBooks } from '../controllers/bookController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
const router = express.Router();

router.route('/').get(getAllBooks).post(protect, upload.single('coverImage'), createBook);
router.get('/my-books', protect, getMyBooks);
router.route('/:id').get(getBookById).put(protect, upload.single('coverImage'), updateBook).delete(protect, deleteBook);
router.get('/user/:userId', getUserBooks);

export default router;