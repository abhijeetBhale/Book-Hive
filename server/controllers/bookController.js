import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRequest from '../models/BorrowRequest.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { awardPoints } from '../services/achievementService.js';

// @desc    Get all books with advanced search and filtering
// @route   GET /api/books
export const getAllBooks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      search = '',
      category = '',
      author = '',
      condition = '',
      language = '',
      genre = '',
      minYear = '',
      maxYear = '',
      isAvailable = '',
      forBorrowing = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      latitude = '',
      longitude = '',
      maxDistance = '50000', // 50km default
      isbn = '',
      tags = ''
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    // Build query object
    let query = {};

    // Text search across multiple fields
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { genre: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Author filter
    if (author.trim()) {
      query.author = { $regex: author, $options: 'i' };
    }

    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    // Language filter
    if (language && language !== 'All') {
      query.language = language;
    }

    // Genre filter
    if (genre && genre !== 'All') {
      query.genre = { $in: [genre] };
    }

    // Publication year range
    if (minYear || maxYear) {
      query.publicationYear = {};
      if (minYear) query.publicationYear.$gte = Number(minYear);
      if (maxYear) query.publicationYear.$lte = Number(maxYear);
    }

    // Availability filters
    if (isAvailable !== '') {
      query.isAvailable = isAvailable === 'true';
    }

    if (forBorrowing !== '') {
      query.forBorrowing = forBorrowing === 'true';
    }

    // ISBN search
    if (isbn.trim()) {
      query.isbn = { $regex: isbn.replace(/[-\s]/g, ''), $options: 'i' };
    }

    // Tags filter
    if (tags.trim()) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
    }

    // Build sort object
    let sort = {};
    const validSortFields = ['title', 'author', 'createdAt', 'publicationYear', 'viewCount', 'borrowCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sort[sortField] = sortDirection;

    // Location-based search
    let aggregationPipeline = [];
    
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const maxDist = parseInt(maxDistance) || 50000;

      if (!isNaN(lat) && !isNaN(lng)) {
        aggregationPipeline = [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'ownerData'
            }
          },
          {
            $match: {
              ...query,
              'ownerData.location': {
                $near: {
                  $geometry: { type: 'Point', coordinates: [lng, lat] },
                  $maxDistance: maxDist
                }
              }
            }
          },
          {
            $addFields: {
              distance: {
                $let: {
                  vars: {
                    ownerLocation: { $arrayElemAt: ['$ownerData.location.coordinates', 0] }
                  },
                  in: {
                    $multiply: [
                      {
                        $acos: {
                          $add: [
                            {
                              $multiply: [
                                { $sin: { $degreesToRadians: lat } },
                                { $sin: { $degreesToRadians: { $arrayElemAt: ['$$ownerLocation', 1] } } }
                              ]
                            },
                            {
                              $multiply: [
                                { $cos: { $degreesToRadians: lat } },
                                { $cos: { $degreesToRadians: { $arrayElemAt: ['$$ownerLocation', 1] } } },
                                { $cos: { $degreesToRadians: { $subtract: [lng, { $arrayElemAt: ['$$ownerLocation', 0] }] } } }
                              ]
                            }
                          ]
                        }
                      },
                      6371000 // Earth's radius in meters
                    ]
                  }
                }
              }
            }
          },
          { $sort: { distance: 1, ...sort } },
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [{ $project: { name: 1, email: 1, avatar: 1, location: 1 } }]
            }
          },
          { $unwind: '$owner' }
        ];
      }
    }

    let books, total;

    if (aggregationPipeline.length > 0) {
      // Use aggregation for location-based search
      const [booksResult, totalResult] = await Promise.all([
        Book.aggregate(aggregationPipeline),
        Book.aggregate([
          ...aggregationPipeline.slice(0, -3), // Remove skip, limit, and lookup
          { $count: 'total' }
        ])
      ]);
      
      books = booksResult;
      total = totalResult[0]?.total || 0;
    } else {
      // Use regular find for non-location searches
      const [booksResult, totalResult] = await Promise.all([
        Book.find(query)
          .populate('owner', 'name email avatar location')
          .sort(sort)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Book.countDocuments(query),
      ]);
      
      books = booksResult;
      total = totalResult;
    }

    res.json({
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      filters: {
        search,
        category,
        author,
        condition,
        language,
        genre,
        minYear,
        maxYear,
        isAvailable,
        forBorrowing,
        sortBy,
        sortOrder,
        hasLocationFilter: !!(latitude && longitude)
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ message: 'Server error getting books', error: error.message });
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
    
    // Award points for adding a book
    await awardPoints(req.user._id, 'book_added', 10);
    
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

// @desc    Search books by ISBN
// @route   GET /api/books/search/isbn/:isbn
export const searchByISBN = async (req, res) => {
  try {
    const { isbn } = req.params;
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    const books = await Book.find({
      isbn: { $regex: cleanISBN, $options: 'i' }
    }).populate('owner', 'name email avatar location');

    res.json({ books, count: books.length });
  } catch (error) {
    console.error('ISBN search error:', error);
    res.status(500).json({ message: 'Server error searching by ISBN' });
  }
};

// @desc    Get book suggestions based on user's reading history
// @route   GET /api/books/suggestions
export const getBookSuggestions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(50, Number(limit) || 10);

    // This is a simplified recommendation system
    // In a real-world scenario, you'd use more sophisticated algorithms
    
    // Get user's borrowed books to understand preferences
    const userBorrowHistory = await BorrowRequest.find({
      borrower: req.user._id,
      status: { $in: ['borrowed', 'returned'] }
    }).populate('book');

    let suggestedBooks = [];

    if (userBorrowHistory.length > 0) {
      // Get categories and authors from user's history
      const userCategories = [...new Set(userBorrowHistory.map(req => req.book.category))];
      const userAuthors = [...new Set(userBorrowHistory.map(req => req.book.author))];

      // Find similar books
      suggestedBooks = await Book.find({
        owner: { $ne: req.user._id }, // Exclude user's own books
        isAvailable: true,
        forBorrowing: true,
        $or: [
          { category: { $in: userCategories } },
          { author: { $in: userAuthors } }
        ]
      })
      .populate('owner', 'name email avatar location')
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limitNum);
    } else {
      // For new users, show popular books
      suggestedBooks = await Book.find({
        owner: { $ne: req.user._id },
        isAvailable: true,
        forBorrowing: true
      })
      .populate('owner', 'name email avatar location')
      .sort({ borrowCount: -1, viewCount: -1 })
      .limit(limitNum);
    }

    res.json({ books: suggestedBooks, count: suggestedBooks.length });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error getting suggestions' });
  }
};

// @desc    Get trending books
// @route   GET /api/books/trending
export const getTrendingBooks = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = Math.min(50, Number(limit) || 20);

    // Get books with high activity in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingBooks = await Book.find({
      isAvailable: true,
      forBorrowing: true,
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('owner', 'name email avatar location')
    .sort({ viewCount: -1, borrowCount: -1, createdAt: -1 })
    .limit(limitNum);

    res.json({ books: trendingBooks, count: trendingBooks.length });
  } catch (error) {
    console.error('Get trending books error:', error);
    res.status(500).json({ message: 'Server error getting trending books' });
  }
};

// @desc    Get filter options for advanced search
// @route   GET /api/books/filters
export const getFilterOptions = async (req, res) => {
  try {
    console.log('Getting filter options...');
    
    const [categories, authors, conditions, languages, genres] = await Promise.all([
      Book.distinct('category'),
      Book.distinct('author'),
      Book.distinct('condition'),
      Book.distinct('language'),
      Book.distinct('genre')
    ]);

    console.log('Filter data:', { categories, authors, conditions, languages, genres });

    const yearRange = await Book.aggregate([
      {
        $group: {
          _id: null,
          minYear: { $min: '$publicationYear' },
          maxYear: { $max: '$publicationYear' }
        }
      }
    ]);

    // Provide fallback data if no books exist
    const defaultConditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'];
    const defaultLanguages = ['English', 'Spanish', 'French', 'German', 'Other'];
    
    const response = {
      categories: categories.length > 0 ? categories.sort() : ['Fiction', 'Non-Fiction', 'Science', 'History'],
      authors: authors.sort(),
      conditions: conditions.length > 0 ? conditions : defaultConditions,
      languages: languages.length > 0 ? languages.sort() : defaultLanguages,
      genres: genres.flat().filter(Boolean).sort(),
      yearRange: yearRange[0] || { minYear: 1800, maxYear: new Date().getFullYear() }
    };

    console.log('Sending filter options response:', response);
    res.json(response);
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ 
      message: 'Server error getting filter options',
      error: error.message 
    });
  }
};