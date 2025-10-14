import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRequest from '../models/BorrowRequest.js';
import BookClub from '../models/BookClub.js';
import Achievement from '../models/Achievement.js';
import UserStats from '../models/UserStats.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Super Admin only)
export const getDashboardOverview = catchAsync(async (req, res, next) => {
  // Get current date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parallel queries for better performance
  try {
    const [
      totalUsers,
      totalBooks,
      totalBorrowRequests,
      totalClubs,
      activeUsers,
      newUsersThisMonth,
      newBooksThisMonth,
      activeBorrowRequests,
      completedBorrowRequests,
      recentUsers,
      recentBooks,
      systemStats
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Book.countDocuments().catch(() => 0),
      BorrowRequest.countDocuments().catch(() => 0),
      BookClub.countDocuments().catch(() => 0),
      User.countDocuments({ lastActive: { $gte: startOfWeek } }).catch(() => 0),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }).catch(() => 0),
      Book.countDocuments({ createdAt: { $gte: startOfMonth } }).catch(() => 0),
      BorrowRequest.countDocuments({ status: { $in: ['pending', 'approved', 'borrowed'] } }).catch(() => 0),
      BorrowRequest.countDocuments({ status: 'returned' }).catch(() => 0),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt avatar').catch(() => []),
      Book.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'name').select('title author createdAt owner').catch(() => []),
      getSystemStats().catch(() => ({ dailyActiveUsers: 0, dailyNewUsers: 0, dailyNewBooks: 0, dailyBorrowRequests: 0 }))
    ]);

    // Calculate growth rates
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [lastMonthUsers, lastMonthBooks] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }).catch(() => 0),
      Book.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }).catch(() => 0)
    ]);

    const userGrowthRate = lastMonthUsers > 0 ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers * 100) : 0;
    const bookGrowthRate = lastMonthBooks > 0 ? ((newBooksThisMonth - lastMonthBooks) / lastMonthBooks * 100) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          totalBooks,
          totalBorrowRequests,
          totalClubs,
          activeUsers,
          newUsersThisMonth,
          newBooksThisMonth,
          activeBorrowRequests,
          completedBorrowRequests,
          userGrowthRate: Math.round(userGrowthRate * 100) / 100,
          bookGrowthRate: Math.round(bookGrowthRate * 100) / 100
        },
        recentActivity: {
          recentUsers,
          recentBooks
        },
        systemStats
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return next(new AppError('Failed to load dashboard data', 500));
  }
});

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Super Admin only)
export const getUsers = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    if (status === 'active') {
      query.lastActive = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (status === 'inactive') {
      query.lastActive = { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const users = await User.find(query)
    .select('-password')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await User.countDocuments(query);

  // Get additional stats for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [bookCount, borrowCount, lendCount] = await Promise.all([
        Book.countDocuments({ owner: user._id }),
        BorrowRequest.countDocuments({ borrower: user._id }),
        BorrowRequest.countDocuments({ owner: user._id })
      ]);

      return {
        ...user,
        stats: {
          booksOwned: bookCount,
          borrowRequests: borrowCount,
          lendRequests: lendCount
        }
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private (Super Admin only)
export const getUserDetails = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password').lean();

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user's books, borrow history, and stats
  const [books, borrowHistory, lendHistory, userStats] = await Promise.all([
    Book.find({ owner: req.params.id }).sort({ createdAt: -1 }).limit(10),
    BorrowRequest.find({ borrower: req.params.id })
      .populate('book', 'title author')
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
    BorrowRequest.find({ owner: req.params.id })
      .populate('book', 'title author')
      .populate('borrower', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
    UserStats.findOne({ user: req.params.id })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      user,
      books,
      borrowHistory,
      lendHistory,
      userStats
    }
  });
});

// @desc    Update user status or role
// @route   PUT /api/admin/users/:id
// @access  Private (Super Admin only)
export const updateUser = catchAsync(async (req, res, next) => {
  const { role, isActive, notes } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent modifying super admin
  if (user.role === 'superadmin' && req.user._id.toString() !== user._id.toString()) {
    return next(new AppError('Cannot modify super admin account', 403));
  }

  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (notes !== undefined) user.adminNotes = notes;

  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        adminNotes: user.adminNotes
      }
    }
  });
});

// @desc    Get all books with filters
// @route   GET /api/admin/books
// @access  Private (Super Admin only)
export const getBooks = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    if (status === 'available') {
      query.isAvailable = true;
    } else if (status === 'borrowed') {
      query.isAvailable = false;
    }
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const books = await Book.find(query)
    .populate('owner', 'name email')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Book.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Delete book
// @route   DELETE /api/admin/books/:id
// @access  Private (Super Admin only)
export const deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check if book is currently borrowed
  const activeBorrow = await BorrowRequest.findOne({
    book: req.params.id,
    status: 'borrowed'
  });

  if (activeBorrow) {
    return next(new AppError('Cannot delete book that is currently borrowed', 400));
  }

  await Book.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Super Admin only)
export const getAnalytics = catchAsync(async (req, res, next) => {
  const { period = '30d' } = req.query;

  let startDate;
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get analytics data
  const [userGrowth, bookGrowth, borrowActivity, topUsers, topBooks] = await Promise.all([
    getUserGrowthData(startDate),
    getBookGrowthData(startDate),
    getBorrowActivityData(startDate),
    getTopUsers(),
    getTopBooks()
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      userGrowth,
      bookGrowth,
      borrowActivity,
      topUsers,
      topBooks
    }
  });
});

// Helper functions
async function getSystemStats() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [dailyActiveUsers, dailyNewUsers, dailyNewBooks, dailyBorrowRequests] = await Promise.all([
      User.countDocuments({ lastActive: { $gte: startOfDay } }).catch(() => 0),
      User.countDocuments({ createdAt: { $gte: startOfDay } }).catch(() => 0),
      Book.countDocuments({ createdAt: { $gte: startOfDay } }).catch(() => 0),
      BorrowRequest.countDocuments({ createdAt: { $gte: startOfDay } }).catch(() => 0)
    ]);

    return {
      dailyActiveUsers,
      dailyNewUsers,
      dailyNewBooks,
      dailyBorrowRequests
    };
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    return {
      dailyActiveUsers: 0,
      dailyNewUsers: 0,
      dailyNewBooks: 0,
      dailyBorrowRequests: 0
    };
  }
}

async function getUserGrowthData(startDate) {
  const users = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return users.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day),
    count: item.count
  }));
}

async function getBookGrowthData(startDate) {
  const books = await Book.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return books.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day),
    count: item.count
  }));
}

async function getBorrowActivityData(startDate) {
  const activity = await BorrowRequest.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return activity.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day),
    status: item._id.status,
    count: item.count
  }));
}

async function getTopUsers() {
  return await User.aggregate([
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: 'owner',
        as: 'books'
      }
    },
    {
      $lookup: {
        from: 'borrowrequests',
        localField: '_id',
        foreignField: 'borrower',
        as: 'borrowRequests'
      }
    },
    {
      $addFields: {
        bookCount: { $size: '$books' },
        borrowCount: { $size: '$borrowRequests' },
        totalActivity: { $add: [{ $size: '$books' }, { $size: '$borrowRequests' }] }
      }
    },
    { $sort: { totalActivity: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        email: 1,
        avatar: 1,
        bookCount: 1,
        borrowCount: 1,
        totalActivity: 1
      }
    }
  ]);
}

async function getTopBooks() {
  return await Book.aggregate([
    {
      $lookup: {
        from: 'borrowrequests',
        localField: '_id',
        foreignField: 'book',
        as: 'borrowRequests'
      }
    },
    {
      $addFields: {
        borrowCount: { $size: '$borrowRequests' }
      }
    },
    { $sort: { borrowCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner'
      }
    },
    {
      $project: {
        title: 1,
        author: 1,
        coverImage: 1,
        borrowCount: 1,
        'owner.name': 1,
        'owner.email': 1
      }
    }
  ]);
}

// @desc    Get all borrow requests with filters
// @route   GET /api/admin/borrow-requests
// @access  Private (Super Admin only)
export const getBorrowRequests = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  let query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const borrowRequests = await BorrowRequest.find(query)
    .populate('book', 'title author coverImage')
    .populate('borrower', 'name email avatar')
    .populate('owner', 'name email')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Filter by search if provided
  let filteredRequests = borrowRequests;
  if (search) {
    filteredRequests = borrowRequests.filter(request =>
      request.book?.title?.toLowerCase().includes(search.toLowerCase()) ||
      request.borrower?.name?.toLowerCase().includes(search.toLowerCase()) ||
      request.owner?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = await BorrowRequest.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      borrowRequests: filteredRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update borrow request status
// @route   PUT /api/admin/borrow-requests/:id
// @access  Private (Super Admin only)
export const updateBorrowRequest = catchAsync(async (req, res, next) => {
  const { status, adminNotes } = req.body;

  const borrowRequest = await BorrowRequest.findById(req.params.id);
  if (!borrowRequest) {
    return next(new AppError('Borrow request not found', 404));
  }

  if (status) borrowRequest.status = status;
  if (adminNotes) borrowRequest.adminNotes = adminNotes;
  borrowRequest.updatedAt = new Date();

  await borrowRequest.save();

  res.status(200).json({
    status: 'success',
    data: {
      borrowRequest
    }
  });
});

// @desc    Get all book clubs with filters
// @route   GET /api/admin/book-clubs
// @access  Private (Super Admin only)
export const getBookClubs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (status && status !== 'all') {
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const bookClubs = await BookClub.find(query)
    .populate('creator', 'name email')
    .populate('members', 'name')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await BookClub.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      bookClubs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update book club
// @route   PUT /api/admin/book-clubs/:id
// @access  Private (Super Admin only)
export const updateBookClub = catchAsync(async (req, res, next) => {
  const { isActive, adminNotes } = req.body;

  const bookClub = await BookClub.findById(req.params.id);
  if (!bookClub) {
    return next(new AppError('Book club not found', 404));
  }

  if (isActive !== undefined) bookClub.isActive = isActive;
  if (adminNotes !== undefined) bookClub.adminNotes = adminNotes;

  await bookClub.save();

  res.status(200).json({
    status: 'success',
    data: {
      bookClub
    }
  });
});

// @desc    Delete book club
// @route   DELETE /api/admin/book-clubs/:id
// @access  Private (Super Admin only)
export const deleteBookClub = catchAsync(async (req, res, next) => {
  const bookClub = await BookClub.findById(req.params.id);

  if (!bookClub) {
    return next(new AppError('Book club not found', 404));
  }

  await BookClub.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get reports (placeholder for future implementation)
// @route   GET /api/admin/reports
// @access  Private (Super Admin only)
export const getReports = catchAsync(async (req, res, next) => {
  // Placeholder - implement when you add reports model
  res.status(200).json({
    status: 'success',
    data: {
      reports: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    }
  });
});

// @desc    Update report (placeholder for future implementation)
// @route   PUT /api/admin/reports/:id
// @access  Private (Super Admin only)
export const updateReport = catchAsync(async (req, res, next) => {
  // Placeholder - implement when you add reports model
  res.status(200).json({
    status: 'success',
    data: {
      message: 'Report updated successfully'
    }
  });
});