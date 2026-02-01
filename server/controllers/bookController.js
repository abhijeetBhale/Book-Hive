import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRequest from '../models/BorrowRequest.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { awardPoints } from '../services/achievementService.js';
import PriceValidationService from '../services/priceValidationService.js';
import WishlistNotificationService from '../services/wishlistNotificationService.js';
import { isProfileComplete } from '../utils/profileCompletionChecker.js';

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
      minPrice = '',
      maxPrice = '',
      isAvailable = '',
      forBorrowing = '',
      bookType = '', // New parameter from frontend
      sortBy = 'createdAt',
      sortOrder = 'desc',
      latitude = '',
      longitude = '',
      maxDistance = '50000', // 50km default
      useLocation = 'false',
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

    // Price range filter (for selling books)
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    // Availability filters
    if (isAvailable !== '') {
      query.isAvailable = isAvailable === 'true';
    }

    // Handle bookType parameter from frontend
    if (bookType) {
      switch (bookType) {
        case 'borrowing':
          query.forBorrowing = true;
          break;
        case 'selling':
          query.forSelling = true;
          break;
        case 'both':
          query.$or = [
            { forBorrowing: true },
            { forSelling: true }
          ];
          break;
        default:
          // If bookType is provided but not recognized, default to borrowing
          query.forBorrowing = true;
      }
    } else {
      // Legacy support for forBorrowing parameter
      if (forBorrowing !== '') {
        query.forBorrowing = forBorrowing === 'true';
      }
    }

    // Add forSelling filter (legacy support)
    const { forSelling } = req.query;
    if (forSelling !== '' && forSelling !== undefined && !bookType) {
      query.forSelling = forSelling === 'true';
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

    // Build sort object with verified user boost
    let sort = {};
    const validSortFields = ['title', 'author', 'createdAt', 'publicationYear', 'viewCount', 'borrowCount', 'sellingPrice'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Premium feature: Verified users get search boost
    // Their books appear first, then sorted by the selected field
    sort = {
      'ownerVerified': -1, // Verified users first (will be added in aggregation)
      [sortField]: sortDirection
    };

    // Location-based search
    let aggregationPipeline = [];
    
    if (latitude && longitude && useLocation === 'true') {
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
      // Use aggregation for search boost (verified users first)
      const aggregation = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerData'
          }
        },
        {
          $addFields: {
            ownerVerified: { 
              $cond: [
                { $eq: [{ $arrayElemAt: ['$ownerData.isVerified', 0] }, true] },
                1,
                0
              ]
            }
          }
        },
        { $sort: sort },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
            pipeline: [
              { 
                $project: { 
                  name: 1, 
                  email: 1, 
                  avatar: 1, 
                  location: 1,
                  isVerified: 1,
                  'contactVerification.email.isVerified': 1
                } 
              }
            ]
          }
        },
        { $unwind: '$owner' },
        { $project: { ownerData: 0, ownerVerified: 0 } } // Remove temporary fields
      ];

      const [booksResult, totalResult] = await Promise.all([
        Book.aggregate(aggregation),
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
        condition,
        bookType,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ 
      message: 'Server error getting books', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('owner', 'name email avatar location isVerified');
    if (book) {
      // Increment view count
      book.viewCount = (book.viewCount || 0) + 1;
      await book.save({ validateBeforeSave: false });
      
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    console.error('Get book error:', error);
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
      forSelling,
      lendingDuration,
      sellingPrice,
      isAvailable,
      isAvailableForBorrowing,
      isCurrentlyAvailable,
      coverImageUrl,
      securityDeposit,
      lendingFee
    } = req.body;
    
    // Validate condition value
    const validConditions = ['new', 'good', 'worn'];
    if (condition && !validConditions.includes(condition.toLowerCase())) {
      return res.status(400).json({ 
        message: `Invalid condition. Must be one of: ${validConditions.join(', ')}` 
      });
    }
    
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
    
    // Validate selling price if book is for selling
    let priceValidationResult = null;
    if (forSelling && sellingPrice) {
      const priceValidationService = new PriceValidationService();
      priceValidationResult = await priceValidationService.validateBookPrice(
        { title, author, isbn },
        parseFloat(sellingPrice)
      );
    }

    const book = new Book({
      title,
      author,
      description,
      category,
      isbn,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      condition: condition && condition.trim() !== '' ? condition.toLowerCase() : 'good', // Default to 'good' if empty
      // Handle different boolean field names from frontend
      forBorrowing: isAvailableForBorrowing !== undefined ? isAvailableForBorrowing : (forBorrowing !== undefined ? forBorrowing : true),
      forSelling: forSelling || false,
      lendingDuration: lendingDuration ? Number(lendingDuration) : 14, // Default 14 days
      sellingPrice: forSelling && sellingPrice ? Number(sellingPrice) : null,
      isAvailable: isCurrentlyAvailable !== undefined ? isCurrentlyAvailable : (isAvailable !== undefined ? isAvailable : true),
      owner: req.user._id,
      coverImage: finalCoverImageUrl,
      // Add price validation data if available
      ...(priceValidationResult && {
        marketPrice: priceValidationResult.priceComparison?.marketPrice,
        priceValidation: priceValidationResult
      }),
      securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      lendingFee: lendingFee ? (Number(lendingFee) >= 0 ? Number(lendingFee) : 0) : 0
    });
    
    const createdBook = await book.save();
    
    // Add the book to user's booksOwned array
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { booksOwned: createdBook._id } },
      { new: true }
    ).populate('booksOwned', '_id');
    
    // Check if profile is now complete (user added their first book!)
    const profileStatus = isProfileComplete(updatedUser);
    if (profileStatus.isComplete) {
      if (!updatedUser.verificationPrompt) {
        updatedUser.verificationPrompt = {};
      }
      updatedUser.verificationPrompt.hasCompletedProfileSetup = true;
      await updatedUser.save();
    }
    
    // Award points for adding a book
    await awardPoints(req.user._id, 'book_added', 10);
    
    // Check for wishlist notifications if book is available
    if (createdBook.isAvailable && createdBook.forBorrowing) {
      try {
        await WishlistNotificationService.checkAllNotifications(createdBook._id);
      } catch (notifError) {
        console.error('Failed to check wishlist notifications:', notifError);
      }
    }
    
    // Notify admins of new book
    try {
      const adminNotificationService = req.app.get('adminNotificationService');
      if (adminNotificationService) {
        const populatedBook = await Book.findById(createdBook._id).populate('owner', 'name');
        if (forSelling) {
          adminNotificationService.notifyNewBookForSale(populatedBook);
        } else {
          adminNotificationService.notifyNewBook(populatedBook);
        }
      }
    } catch (adminNotifError) {
      console.error('Failed to send admin notification for new book:', adminNotifError);
    }
    
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
      forSelling,
      lendingDuration,
      sellingPrice,
      isAvailable,
      isAvailableForBorrowing,
      isCurrentlyAvailable,
      coverImageUrl,
      securityDeposit,
      lendingFee 
    } = req.body;

    const book = await Book.findById(req.params.id);

    if (book) {
      if (book.owner.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Validate condition value if provided
      if (condition) {
        const validConditions = ['new', 'good', 'worn'];
        if (!validConditions.includes(condition.toLowerCase())) {
          return res.status(400).json({ 
            message: `Invalid condition. Must be one of: ${validConditions.join(', ')}` 
          });
        }
      }

      let finalCoverImageUrl = book.coverImage;
      
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'bookhive_books',
          width: 400,
          height: 600,
          crop: 'fill',
          resource_type: 'image'
        });
        finalCoverImageUrl = result.secure_url;
      } else if (coverImageUrl) {
        finalCoverImageUrl = coverImageUrl;
      }

      // Validate selling price if book is for selling
      let priceValidationResult = null;
      if (forSelling && sellingPrice) {
        const priceValidationService = new PriceValidationService();
        priceValidationResult = await priceValidationService.validateBookPrice(
          { title, author, isbn },
          parseFloat(sellingPrice)
        );
      }

      book.title = title || book.title;
      book.author = author || book.author;
      book.description = description || book.description;
      book.category = category || book.category;
      book.isbn = isbn || book.isbn;
      book.publicationYear = publicationYear ? Number(publicationYear) : book.publicationYear;
      book.condition = condition ? condition.toLowerCase() : book.condition;
      
      // Handle booleans carefully
      if (forBorrowing !== undefined) book.forBorrowing = forBorrowing;
      if (isAvailableForBorrowing !== undefined) book.forBorrowing = isAvailableForBorrowing;
      
      if (forSelling !== undefined) book.forSelling = forSelling;
      
      if (isAvailable !== undefined) book.isAvailable = isAvailable;
      if (isCurrentlyAvailable !== undefined) book.isAvailable = isCurrentlyAvailable;
      
      book.lendingDuration = lendingDuration ? Number(lendingDuration) : book.lendingDuration;
      book.sellingPrice = (forSelling || book.forSelling) && sellingPrice ? Number(sellingPrice) : book.sellingPrice;
      book.coverImage = finalCoverImageUrl;
      
      if (securityDeposit !== undefined) {
        book.securityDeposit = Number(securityDeposit);
      }
      
      if (lendingFee !== undefined) {
        book.lendingFee = Number(lendingFee) >= 0 ? Number(lendingFee) : 0;
      }

      if (priceValidationResult) {
        book.marketPrice = priceValidationResult.priceComparison?.marketPrice;
        book.priceValidation = priceValidationResult;
      }

      const updatedBook = await book.save();
      
      // Check for wishlist notifications if book became available
      if (updatedBook.isAvailable && updatedBook.forBorrowing && !book.isAvailable) {
        try {
          await WishlistNotificationService.checkAllNotifications(updatedBook._id);
        } catch (notifError) {
          console.error('Failed to check wishlist notifications:', notifError);
        }
      }
      
      // Notify admins of book update
      try {
        const adminNotificationService = req.app.get('adminNotificationService');
        if (adminNotificationService) {
          const populatedBook = await Book.findById(updatedBook._id).populate('owner', 'name');
          adminNotificationService.notifyBookUpdated(populatedBook);
        }
      } catch (adminNotifError) {
        console.error('Failed to send admin notification for book update:', adminNotifError);
      }
      
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
    const book = await Book.findById(req.params.id).populate('owner', 'name');
    if (book) {
      if (book.owner._id.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      // Store book info before deletion for notification
      const bookInfo = {
        _id: book._id,
        title: book.title,
        author: book.author,
        owner: book.owner
      };
      
      // Remove book from user's booksOwned array
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { booksOwned: book._id } },
        { new: true }
      );
      
      await book.deleteOne();
      
      // Notify admins of book deletion
      try {
        const adminNotificationService = req.app.get('adminNotificationService');
        if (adminNotificationService) {
          adminNotificationService.notifyBookDeleted(bookInfo);
        }
      } catch (adminNotifError) {
        console.error('Failed to send admin notification for book deletion:', adminNotifError);
      }
      
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
        .populate('owner', 'name email avatar location isVerified')
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
        .populate('owner', 'name email avatar location isVerified')
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
    }).populate('owner', 'name email avatar location isVerified');

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
      .populate('owner', 'name email avatar location isVerified')
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limitNum);
    } else {
      // For new users, show popular books
      suggestedBooks = await Book.find({
        owner: { $ne: req.user._id },
        isAvailable: true,
        forBorrowing: true
      })
      .populate('owner', 'name email avatar location isVerified')
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
    .populate('owner', 'name email avatar location isVerified')
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

// @desc    Validate book price against market rates
// @route   POST /api/books/validate-price
export const validateBookPrice = async (req, res) => {
  try {
    const { title, author, isbn, sellingPrice, condition } = req.body;

    if (!title || !author || !sellingPrice) {
      return res.status(400).json({
        message: 'Title, author, and selling price are required'
      });
    }

    const priceValidationService = new PriceValidationService();
    const validation = await priceValidationService.validateBookPrice(
      { title, author, isbn },
      parseFloat(sellingPrice)
    );

    // If we have condition info, calculate recommended price
    if (condition && validation.priceComparison) {
      const recommendedPrice = priceValidationService.calculateRecommendedPrice(
        validation.priceComparison.marketPrice,
        condition,
        'general' // You could determine category from title/description
      );
      
      validation.recommendedPrice = recommendedPrice;
    }

    res.json(validation);
  } catch (error) {
    console.error('Price validation error:', error);
    res.status(500).json({
      message: 'Server error validating price',
      error: error.message
    });
  }
};

// @desc    Get books for sale
// @route   GET /api/books/for-sale
export const getBooksForSale = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      search = '',
      category = '',
      minPrice = '',
      maxPrice = '',
      condition = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    // Build query for books for sale
    let query = { forSelling: true, isAvailable: true };

    // Text search
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    // Build sort object
    let sort = {};
    const validSortFields = ['title', 'author', 'createdAt', 'sellingPrice'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sort[sortField] = sortDirection;

    const [books, total] = await Promise.all([
      Book.find(query)
        .populate('owner', 'name email avatar location isVerified')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Book.countDocuments(query),
    ]);

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
        minPrice,
        maxPrice,
        condition,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get books for sale error:', error);
    res.status(500).json({ message: 'Server error getting books for sale', error: error.message });
  }
};
// @desc    Get enhanced search filters with real data
// @route   GET /api/books/enhanced-filters
export const getEnhancedFilters = async (req, res) => {
  try {
    const [
      categories,
      authors,
      conditions,
      languages,
      genres,
      tags,
      yearRange,
      priceRange
    ] = await Promise.all([
      Book.distinct('category').then(cats => cats.filter(Boolean).sort()),
      Book.distinct('author').then(authors => authors.filter(Boolean).sort()),
      Book.distinct('condition').then(conds => conds.filter(Boolean)),
      Book.distinct('language').then(langs => langs.filter(Boolean).sort()),
      Book.aggregate([
        { $unwind: '$genre' },
        { $group: { _id: '$genre' } },
        { $sort: { _id: 1 } }
      ]).then(result => result.map(item => item._id).filter(Boolean)),
      Book.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags' } },
        { $sort: { _id: 1 } }
      ]).then(result => result.map(item => item._id).filter(Boolean)),
      Book.aggregate([
        {
          $group: {
            _id: null,
            minYear: { $min: '$publicationYear' },
            maxYear: { $max: '$publicationYear' }
          }
        }
      ]),
      Book.aggregate([
        { $match: { forSelling: true, sellingPrice: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$sellingPrice' },
            maxPrice: { $max: '$sellingPrice' }
          }
        }
      ])
    ]);

    // Get book counts by category for better UX
    const categoryStats = await Book.aggregate([
      { $match: { isAvailable: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const response = {
      categories: categories.map(cat => {
        const stat = categoryStats.find(s => s._id === cat);
        return {
          name: cat,
          count: stat ? stat.count : 0
        };
      }),
      authors: authors.slice(0, 100), // Limit to top 100 authors
      conditions: conditions.length > 0 ? conditions : 
        ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
      languages: languages.length > 0 ? languages : 
        ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Other'],
      genres: genres.slice(0, 50), // Limit to top 50 genres
      tags: tags.slice(0, 100), // Limit to top 100 tags
      yearRange: yearRange[0] || { 
        minYear: 1800, 
        maxYear: new Date().getFullYear() 
      },
      priceRange: priceRange[0] || { 
        minPrice: 0, 
        maxPrice: 100 
      },
      // Additional filter options
      availability: [
        { name: 'Available', value: 'true' },
        { name: 'Not Available', value: 'false' }
      ],
      bookTypes: [
        { name: 'For Borrowing', value: 'borrowing' },
        { name: 'For Sale', value: 'selling' },
        { name: 'Both', value: 'both' }
      ],
      sortOptions: [
        { name: 'Newest First', value: 'createdAt_desc' },
        { name: 'Oldest First', value: 'createdAt_asc' },
        { name: 'Title A-Z', value: 'title_asc' },
        { name: 'Title Z-A', value: 'title_desc' },
        { name: 'Author A-Z', value: 'author_asc' },
        { name: 'Author Z-A', value: 'author_desc' },
        { name: 'Most Popular', value: 'viewCount_desc' },
        { name: 'Most Borrowed', value: 'borrowCount_desc' },
        { name: 'Price Low to High', value: 'sellingPrice_asc' },
        { name: 'Price High to Low', value: 'sellingPrice_desc' }
      ]
    };

    res.json(response);
  } catch (error) {
    console.error('Get enhanced filters error:', error);
    res.status(500).json({ 
      message: 'Server error getting enhanced filters',
      error: error.message 
    });
  }
};

// @desc    Get personalized book recommendations
// @route   GET /api/books/recommendations
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;
    const limitNum = Math.min(50, Number(limit) || 20);

    // Get user's reading preferences
    const user = await User.findById(userId).select('readingPreferences wishlist recentlyViewed');
    
    let recommendations = [];
    
    if (user && user.readingPreferences) {
      const { favoriteGenres, favoriteAuthors, maxDistance } = user.readingPreferences;
      
      // Build recommendation query
      let query = {
        owner: { $ne: userId },
        isAvailable: true,
        forBorrowing: true
      };

      // Exclude books already in wishlist
      if (user.wishlist && user.wishlist.length > 0) {
        query._id = { $nin: user.wishlist };
      }

      // Exclude recently viewed books (to show fresh content)
      if (user.recentlyViewed && user.recentlyViewed.length > 0) {
        const recentlyViewedIds = user.recentlyViewed.slice(0, 10).map(item => item.book);
        query._id = query._id ? 
          { ...query._id, $nin: [...(query._id.$nin || []), ...recentlyViewedIds] } :
          { $nin: recentlyViewedIds };
      }

      // Preference-based filters
      const preferenceFilters = [];
      
      if (favoriteGenres && favoriteGenres.length > 0) {
        preferenceFilters.push({ genre: { $in: favoriteGenres } });
      }
      
      if (favoriteAuthors && favoriteAuthors.length > 0) {
        preferenceFilters.push({ author: { $in: favoriteAuthors } });
      }

      if (preferenceFilters.length > 0) {
        query.$or = preferenceFilters;
      }

      // Get location-based recommendations if user has location
      if (user.location && user.location.coordinates && maxDistance) {
        const aggregationPipeline = [
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
                  $geometry: { 
                    type: 'Point', 
                    coordinates: user.location.coordinates 
                  },
                  $maxDistance: (maxDistance || 10) * 1000 // Convert km to meters
                }
              }
            }
          },
          { $limit: limitNum },
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [{ $project: { name: 1, avatar: 1, location: 1, isVerified: 1 } }]
            }
          },
          { $unwind: '$owner' }
        ];

        recommendations = await Book.aggregate(aggregationPipeline);
      } else {
        // Fallback to regular query without location
        recommendations = await Book.find(query)
          .populate('owner', 'name avatar location isVerified')
          .sort({ viewCount: -1, borrowCount: -1, createdAt: -1 })
          .limit(limitNum);
      }
    }

    // If no preferences or no results, show popular books
    if (recommendations.length === 0) {
      recommendations = await Book.find({
        owner: { $ne: userId },
        isAvailable: true,
        forBorrowing: true
      })
      .populate('owner', 'name avatar location isVerified')
      .sort({ borrowCount: -1, viewCount: -1 })
      .limit(limitNum);
    }

    res.json({
      recommendations,
      count: recommendations.length,
      basedOn: user?.readingPreferences ? 'preferences' : 'popularity'
    });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({ message: 'Server error getting recommendations' });
  }
};

// @desc    Fetch book metadata by ISBN
// @route   GET /api/books/isbn/:isbn/metadata
export const fetchISBNMetadata = async (req, res) => {
  try {
    const { isbn } = req.params;
    
    if (!isbn || isbn.trim().length === 0) {
      return res.status(400).json({ 
        message: 'ISBN is required' 
      });
    }

    // Clean ISBN (remove hyphens and spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Validate ISBN format (basic validation)
    if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
      return res.status(400).json({ 
        message: 'Invalid ISBN format. Please provide a valid 10 or 13 digit ISBN.' 
      });
    }

    // Check Redis cache first
    const cacheService = req.app.get('cacheService');
    const cacheKey = `isbn_metadata:${cleanISBN}`;
    
    if (cacheService) {
      try {
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      } catch (cacheError) {
        console.error('Cache read error:', cacheError);
      }
    }

    // Fetch from book API service
    const bookApiService = new (await import('../services/bookApiService.js')).default();
    const bookData = await bookApiService.searchByISBN(cleanISBN);

    if (!bookData) {
      return res.status(404).json({ 
        message: 'No book found for the provided ISBN',
        isbn: cleanISBN
      });
    }

    // Normalize the data for our application
    const normalizedData = {
      title: bookData.title,
      author: bookData.author,
      authors: bookData.authors,
      description: bookData.description,
      isbn: bookData.isbn || cleanISBN,
      publicationYear: bookData.publicationYear,
      publishedDate: bookData.publishedDate,
      publisher: bookData.publisher,
      pageCount: bookData.pageCount,
      language: bookData.language,
      // Normalize categories to our internal genres
      categories: bookData.categories || [],
      category: bookData.category || 'General',
      genres: normalizeGenres(bookData.categories || []),
      // Cover images
      coverImage: bookData.coverImage,
      images: bookData.images,
      // Additional metadata
      rating: bookData.rating,
      ratingsCount: bookData.ratingsCount,
      previewLink: bookData.previewLink,
      infoLink: bookData.infoLink,
      source: bookData.source,
      // Metadata for our system
      fetchedAt: new Date(),
      isbnSearched: cleanISBN
    };

    // Cache the result for 24 hours
    if (cacheService) {
      try {
        await cacheService.set(cacheKey, JSON.stringify(normalizedData), 24 * 60 * 60); // 24 hours
      } catch (cacheError) {
        console.error('Cache write error:', cacheError);
      }
    }

    res.json({
      success: true,
      data: normalizedData,
      source: bookData.source
    });
  } catch (error) {
    console.error('Fetch ISBN metadata error:', error);
    res.status(500).json({ 
      message: 'Server error fetching book metadata',
      error: error.message 
    });
  }
};

// Helper function to normalize genres from external APIs to our internal categories
function normalizeGenres(externalCategories) {
  const genreMapping = {
    // Fiction categories
    'fiction': ['Fiction'],
    'literary fiction': ['Fiction'],
    'science fiction': ['Sci-Fi'],
    'fantasy': ['Fantasy'],
    'mystery': ['Mystery'],
    'thriller': ['Mystery'],
    'romance': ['Romance'],
    'horror': ['Fiction'],
    'adventure': ['Fiction'],
    'historical fiction': ['Fiction', 'History'],
    
    // Non-fiction categories
    'biography': ['Biography'],
    'autobiography': ['Biography'],
    'memoir': ['Biography'],
    'history': ['History'],
    'science': ['Science'],
    'technology': ['Technology'],
    'business': ['Business'],
    'self-help': ['Self-Help'],
    'health': ['Self-Help'],
    'cooking': ['Other'],
    'travel': ['Other'],
    'religion': ['Other'],
    'philosophy': ['Other'],
    'psychology': ['Science'],
    
    // Educational
    'textbook': ['Other'],
    'education': ['Other'],
    'reference': ['Other'],
    
    // Children's books
    'juvenile fiction': ['Children'],
    'children': ['Children'],
    'young adult': ['Young Adult'],
    'teen': ['Young Adult'],
    
    // Other
    'poetry': ['Poetry'],
    'drama': ['Drama'],
    'comics': ['Comics'],
    'graphic novel': ['Comics']
  };

  const normalizedGenres = new Set();
  
  externalCategories.forEach(category => {
    const lowerCategory = category.toLowerCase();
    
    // Check for exact matches first
    if (genreMapping[lowerCategory]) {
      genreMapping[lowerCategory].forEach(genre => normalizedGenres.add(genre));
    } else {
      // Check for partial matches
      Object.keys(genreMapping).forEach(key => {
        if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
          genreMapping[key].forEach(genre => normalizedGenres.add(genre));
        }
      });
    }
  });

  // If no matches found, default to appropriate category
  if (normalizedGenres.size === 0) {
    normalizedGenres.add('Other');
  }

  return Array.from(normalizedGenres);
}