import Book from '../models/Book.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Get all books
// @route   GET /api/books
export const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const [books, total] = await Promise.all([
      Book.find({})
        .populate('owner', 'name email')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Book.countDocuments({}),
    ]);

    res.json({
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ message: 'Server error getting books' });
  }
};

// @desc    Get book by ID
// @route   GET /api/books/:id
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'owner',
      'name email'
    );
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ message: 'Server error getting book' });
  }
};

// @desc    Create a book
// @route   POST /api/books
export const createBook = async (req, res) => {
  try {
    const { 
      title, 
      author, 
      description, 
      category, 
      isbn, 
      publicationYear, 
      condition, 
      forBorrowing, 
      isAvailable,
      isAvailableForBorrowing,
      isCurrentlyAvailable,
      coverImageUrl 
    } = req.body;
    
    let finalCoverImageUrl;
    
    // Priority: uploaded file > Google Books URL > no image
    if (req.file) {
      // Handle uploaded file
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'bookhive_books',
        width: 400,
        height: 600,
        crop: 'fill',
        resource_type: 'image'
      });
      finalCoverImageUrl = result.secure_url;
    } else if (coverImageUrl) {
      // Handle Google Books cover image URL
      finalCoverImageUrl = coverImageUrl;
    }
    
    const book = new Book({
      title,
      author,
      description,
      category,
      isbn,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      condition: condition && condition.trim() !== '' ? condition : 'Good', // Default to 'Good' if empty
      // Handle different boolean field names from frontend
      forBorrowing: isAvailableForBorrowing !== undefined ? isAvailableForBorrowing : (forBorrowing !== undefined ? forBorrowing : true),
      isAvailable: isCurrentlyAvailable !== undefined ? isCurrentlyAvailable : (isAvailable !== undefined ? isAvailable : true),
      owner: req.user._id,
      coverImage: finalCoverImageUrl
    });
    
    const createdBook = await book.save();
    
    // Add the book to user's booksOwned array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { booksOwned: createdBook._id } },
      { new: true }
    );
    
    res.status(201).json(createdBook);
  } catch (error) {
    console.error('Create book error:', error);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
    res.status(500).json({ message: 'Server error creating book', error: error.message });
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
export const updateBook = async (req, res) => {
  try {
    const { 
      title, 
      author, 
      description, 
      category, 
      isbn, 
      publicationYear, 
      condition, 
      forBorrowing, 
      isAvailable,
      coverImageUrl 
    } = req.body;
    const book = await Book.findById(req.params.id);

    if (book) {
      if (book.owner.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      book.title = title || book.title;
      book.author = author || book.author;
      book.description = description || book.description;
      book.category = category || book.category;
      book.isbn = isbn !== undefined ? isbn : book.isbn;
      book.publicationYear = publicationYear ? Number(publicationYear) : book.publicationYear;
      book.condition = condition || book.condition;
      book.forBorrowing = forBorrowing !== undefined ? forBorrowing : book.forBorrowing;
      book.isAvailable = isAvailable !== undefined ? isAvailable : book.isAvailable;

      // Handle cover image update - priority: uploaded file > Google Books URL
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'bookhive_books',
          width: 400,
          height: 600,
          crop: 'fill',
          resource_type: 'image'
        });
        book.coverImage = result.secure_url;
      } else if (coverImageUrl) {
        book.coverImage = coverImageUrl;
      }
      
      const updatedBook = await book.save();
      res.json(updatedBook);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Server error updating book' });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      if (book.owner.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      // Remove book from user's booksOwned array
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { booksOwned: book._id } },
        { new: true }
      );
      
      await book.deleteOne();
      res.json({ message: 'Book removed' });
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Server error deleting book' });
  }
};

// @desc    Get books by user ID
// @route   GET /api/books/user/:userId
export const getUserBooks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const [books, total] = await Promise.all([
      Book.find({ owner: userId })
        .populate('owner', 'name email avatar location')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Book.countDocuments({ owner: userId }),
    ]);

    res.json({
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({ message: 'Server error getting user books' });
  }
};

// @desc    Get logged in user's books
// @route   GET /api/books/my-books
export const getMyBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const [books, total] = await Promise.all([
      Book.find({ owner: req.user._id })
        .populate('owner', 'name email avatar location')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Book.countDocuments({ owner: req.user._id }),
    ]);

    res.json({
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Get my books error:', error);
    res.status(500).json({ message: 'Server error getting your books' });
  }
};