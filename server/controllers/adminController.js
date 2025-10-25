import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRequest from '../models/BorrowRequest.js';
import BookClub from '../models/BookClub.js';
import Achievement from '../models/Achievement.js';
import UserStats from '../models/UserStats.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
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
      totalBooksForSale,
      totalBorrowRequests,
      totalClubs,
      activeUsers,
      newUsersThisMonth,
      newBooksThisMonth,
      newBooksForSaleThisMonth,
      activeBorrowRequests,
      completedBorrowRequests,
      recentUsers,
      recentBooks,
      recentBooksForSale,
      systemStats,
      topCategories,
      recentActivity,
      topBooks,
      bookSharingActivity
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Book.countDocuments().catch(() => 0),
      Book.countDocuments({ forSelling: true }).catch(() => 0),
      BorrowRequest.countDocuments().catch(() => 0),
      BookClub.countDocuments().catch(() => 0),
      User.countDocuments({ lastActive: { $gte: startOfWeek } }).catch(() => 0),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }).catch(() => 0),
      Book.countDocuments({ createdAt: { $gte: startOfMonth } }).catch(() => 0),
      Book.countDocuments({ createdAt: { $gte: startOfMonth }, forSelling: true }).catch(() => 0),
      BorrowRequest.countDocuments({ status: { $in: ['pending', 'approved', 'borrowed'] } }).catch(() => 0),
      BorrowRequest.countDocuments({ status: 'returned' }).catch(() => 0),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt avatar').catch(() => []),
      Book.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'name').select('title author createdAt owner').catch(() => []),
      Book.find({ forSelling: true }).sort({ createdAt: -1 }).limit(5).populate('owner', 'name').select('title author sellingPrice createdAt owner').catch(() => []),
      getSystemStats().catch(() => ({ dailyActiveUsers: 0, dailyNewUsers: 0, dailyNewBooks: 0, dailyBorrowRequests: 0 })),
      getTopCategories().catch(() => []),
      getRecentActivity().catch(() => []),
      getTopBooksData().catch(() => []),
      getBookSharingActivityData().catch(() => ({ monthly: [], quarterly: [], yearly: [] }))
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
          totalBooksForSale,
          totalBorrowRequests,
          totalClubs,
          activeUsers,
          newUsersThisMonth,
          newBooksThisMonth,
          newBooksForSaleThisMonth,
          activeBorrowRequests,
          completedBorrowRequests,
          userGrowthRate: Math.round(userGrowthRate * 100) / 100,
          bookGrowthRate: Math.round(bookGrowthRate * 100) / 100
        },
        recentActivity: {
          recentUsers,
          recentBooks,
          recentBooksForSale,
          activities: recentActivity
        },
        systemStats,
        topCategories,
        topBooks,
        bookSharingActivity
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
    sortOrder = 'desc',
    all = false
  } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }

  if (status && status !== 'all') {
    if (status === 'available') {
      query.isAvailable = true;
    } else if (status === 'borrowed') {
      query.isAvailable = false;
    }
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  let booksQuery = Book.find(query)
    .populate('owner', 'name email avatar')
    .sort(sortOptions)
    .lean();

  // If not requesting all books, apply pagination
  if (!all && limit !== 'all') {
    booksQuery = booksQuery
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
  }

  const books = await booksQuery;
  const total = await Book.countDocuments(query);

  // Calculate pagination info
  const pagination = all || limit === 'all' ? {
    page: 1,
    limit: total,
    total,
    pages: 1
  } : {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  };

  res.status(200).json({
    status: 'success',
    data: {
      books,
      pagination
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

// @desc    Get reports
// @route   GET /api/admin/reports
// @access  Private (Super Admin only)
export const getReports = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
  
  // Build query
  let query = {};
  
  // Status filter
  if (status !== 'all') {
    query.status = status;
  }
  
  // Search filter
  if (search) {
    query.$or = [
      { reason: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Get reports with pagination
  const reports = await Report.find(query)
    .populate('reporterId', 'name email avatar')
    .populate('reportedUserId', 'name email avatar isActive')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Report.countDocuments(query);
  
  // Transform data for frontend
  const transformedReports = reports.map(report => ({
    _id: report._id,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reportedBy: {
      _id: report.reporterId?._id,
      name: report.reporterId?.name || 'Deleted User',
      email: report.reporterId?.email || 'N/A',
      avatar: report.reporterId?.avatar
    },
    reportedUser: {
      _id: report.reportedUserId?._id,
      name: report.reportedUserId?.name || 'Deleted User',
      email: report.reportedUserId?.email || 'N/A',
      avatar: report.reportedUserId?.avatar,
      isActive: report.reportedUserId?.isActive
    }
  }));
  
  res.status(200).json({
    status: 'success',
    data: {
      reports: transformedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update report status and take action
// @route   PUT /api/admin/reports/:id
// @access  Private (Super Admin only)
export const updateReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, action, actionData } = req.body;
  
  const report = await Report.findById(id).populate('reportedUserId');
  
  if (!report) {
    return next(new AppError('Report not found', 404));
  }
  
  // Update report status
  if (status) {
    report.status = status;
  }
  
  // Take action on reported user if specified
  if (action && report.reportedUserId) {
    const reportedUser = report.reportedUserId;
    
    switch (action) {
      case 'warn':
        // Create a warning notification for the user
        await createUserNotification(reportedUser._id, {
          type: 'warning',
          title: 'Community Guidelines Warning',
          message: actionData?.message || 'You have received a warning for violating our community guidelines. Please review our terms of service.',
          severity: 'warning'
        });
        break;
        
      case 'ban':
        // Ban user for specified duration
        const banDuration = actionData?.duration || 7; // days
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + banDuration);
        
        reportedUser.banStatus = {
          isBanned: true,
          banUntil: banUntil,
          reason: actionData?.reason || 'Violation of community guidelines',
          bannedBy: req.user._id
        };
        
        await reportedUser.save();
        
        // Create notification
        await createUserNotification(reportedUser._id, {
          type: 'ban',
          title: 'Account Temporarily Suspended',
          message: `Your account has been suspended until ${banUntil.toLocaleDateString()} for: ${actionData?.reason || 'Violation of community guidelines'}`,
          severity: 'error'
        });
        break;
        
      case 'delete':
        // Deactivate user account
        reportedUser.isActive = false;
        reportedUser.deactivatedAt = new Date();
        reportedUser.deactivatedBy = req.user._id;
        reportedUser.deactivationReason = actionData?.reason || 'Account deleted due to policy violation';
        
        await reportedUser.save();
        
        // Create notification
        await createUserNotification(reportedUser._id, {
          type: 'account_deleted',
          title: 'Account Deactivated',
          message: `Your account has been deactivated for: ${actionData?.reason || 'Policy violation'}`,
          severity: 'error'
        });
        break;
        
      case 'dismiss':
        // No action taken, just update report status
        break;
    }
  }
  
  // Add admin action log
  report.adminActions = report.adminActions || [];
  report.adminActions.push({
    action: action || 'status_update',
    actionBy: req.user._id,
    actionData: actionData,
    timestamp: new Date()
  });
  
  await report.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      message: 'Report updated successfully',
      report: report
    }
  });
});

// Helper function to create user notifications
const createUserNotification = async (userId, notificationData) => {
  try {
    await Notification.create({
      userId: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      severity: notificationData.severity,
      isRead: false,
      metadata: {
        actionType: notificationData.type,
        timestamp: new Date()
      }
    });
    
    console.log(`Notification created for user ${userId}: ${notificationData.title}`);
  } catch (error) {
    console.error('Error creating user notification:', error);
    // Don't fail the main operation if notification fails
  }
};

// @desc    Get book sharing activity data
// @route   GET /api/admin/book-sharing-activity
// @access  Private (Super Admin only)
export const getBookSharingActivity = catchAsync(async (req, res, next) => {
  const { period = 'monthly' } = req.query;
  
  const data = await getBookSharingActivityData();
  
  res.status(200).json({
    status: 'success',
    data: data[period] || data.monthly
  });
});

// @desc    Get books for sale with admin filters
// @route   GET /api/admin/books-for-sale
// @access  Private (Super Admin only)
export const getBooksForSale = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    priceRange,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    all = false
  } = req.query;

  let query = { forSelling: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }

  // Price range filter
  if (priceRange && priceRange !== 'all') {
    switch (priceRange) {
      case 'under10':
        query.sellingPrice = { $lt: 10 };
        break;
      case '10to25':
        query.sellingPrice = { $gte: 10, $lte: 25 };
        break;
      case '25to50':
        query.sellingPrice = { $gte: 25, $lte: 50 };
        break;
      case 'over50':
        query.sellingPrice = { $gt: 50 };
        break;
    }
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  let booksQuery = Book.find(query)
    .populate('owner', 'name email avatar')
    .sort(sortOptions)
    .lean();

  if (!all && limit !== 'all') {
    booksQuery = booksQuery
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
  }

  const books = await booksQuery;
  const total = await Book.countDocuments(query);

  // Add price validation status to each book
  const booksWithValidation = books.map(book => ({
    ...book,
    priceStatus: book.priceValidation?.priceComparison?.isReasonable ? 'reasonable' : 'high',
    marketPrice: book.marketPrice,
    priceDifference: book.priceValidation?.priceComparison?.percentageDifference
  }));

  const pagination = all || limit === 'all' ? {
    page: 1,
    limit: total,
    total,
    pages: 1
  } : {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  };

  res.status(200).json({
    status: 'success',
    data: {
      books: booksWithValidation,
      pagination,
      stats: {
        totalForSale: total,
        averagePrice: books.length > 0 ? books.reduce((sum, book) => sum + (book.sellingPrice || 0), 0) / books.length : 0,
        priceValidated: books.filter(book => book.priceValidation?.isValidated).length
      }
    }
  });
});

// @desc    Get top categories data
// @route   GET /api/admin/top-categories
// @access  Private (Super Admin only)
export const getTopCategoriesData = catchAsync(async (req, res, next) => {
  const categories = await getTopCategories();
  
  res.status(200).json({
    status: 'success',
    data: categories
  });
});

// Helper function to get top categories with real data
async function getTopCategories() {
  try {
    const categories = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          books: { $push: { title: '$title', author: '$author' } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalBooks = await Book.countDocuments();
    
    return categories.map(cat => ({
      name: cat._id || 'Uncategorized',
      count: cat.count,
      percentage: totalBooks > 0 ? Math.round((cat.count / totalBooks) * 100) : 0,
      books: cat.books.slice(0, 3) // Sample books
    }));
  } catch (error) {
    console.error('Error getting top categories:', error);
    return [];
  }
}

// Helper function to get recent activity with real data
async function getRecentActivity() {
  try {
    const [recentBooks, recentBorrows, recentUsers, recentClubs] = await Promise.all([
      Book.find().sort({ createdAt: -1 }).limit(3)
        .populate('owner', 'name')
        .select('title author createdAt owner'),
      BorrowRequest.find().sort({ createdAt: -1 }).limit(3)
        .populate('book', 'title')
        .populate('borrower', 'name')
        .select('status createdAt book borrower'),
      User.find().sort({ createdAt: -1 }).limit(2)
        .select('name email createdAt'),
      BookClub.find().sort({ createdAt: -1 }).limit(2)
        .populate('creator', 'name')
        .select('name createdAt creator members')
    ]);

    const activities = [];

    // Add book activities
    recentBooks.forEach(book => {
      activities.push({
        type: 'book_added',
        title: 'New Book Added',
        description: `${book.title} by ${book.author}`,
        user: book.owner?.name || 'Unknown User',
        timestamp: book.createdAt,
        icon: 'book',
        color: 'blue'
      });
    });

    // Add borrow activities
    recentBorrows.forEach(borrow => {
      activities.push({
        type: 'borrow_request',
        title: `Book ${borrow.status === 'pending' ? 'Requested' : borrow.status === 'approved' ? 'Approved' : 'Returned'}`,
        description: `${borrow.book?.title || 'Unknown Book'}`,
        user: borrow.borrower?.name || 'Unknown User',
        timestamp: borrow.createdAt,
        icon: 'arrow-right',
        color: borrow.status === 'approved' ? 'green' : borrow.status === 'pending' ? 'yellow' : 'purple'
      });
    });

    // Add user activities
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_joined',
        title: 'New User Joined',
        description: `${user.name} joined BookHive`,
        user: user.name,
        timestamp: user.createdAt,
        icon: 'user-plus',
        color: 'green'
      });
    });

    // Add club activities
    recentClubs.forEach(club => {
      activities.push({
        type: 'club_created',
        title: 'New Book Club',
        description: `${club.name} created`,
        user: club.creator?.name || 'Unknown User',
        timestamp: club.createdAt,
        icon: 'users',
        color: 'purple'
      });
    });

    // Sort by timestamp and return latest 8
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

// Helper function to get top books with real data
async function getTopBooksData() {
  try {
    const topBooks = await Book.aggregate([
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
          borrowCount: { $size: '$borrowRequests' },
          completedBorrows: {
            $size: {
              $filter: {
                input: '$borrowRequests',
                cond: { $eq: ['$$this.status', 'returned'] }
              }
            }
          }
        }
      },
      { $sort: { borrowCount: -1, viewCount: -1 } },
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
          category: 1,
          coverImage: 1,
          borrowCount: 1,
          completedBorrows: 1,
          viewCount: 1,
          rating: 1,
          isAvailable: 1,
          'owner.name': 1
        }
      }
    ]);

    return topBooks;
  } catch (error) {
    console.error('Error getting top books:', error);
    return [];
  }
}

// Helper function to get book sharing activity data for different periods
async function getBookSharingActivityData() {
  try {
    const now = new Date();
    
    // Monthly data (last 12 months)
    const monthlyData = await BorrowRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Quarterly data (last 8 quarters)
    const quarterlyData = await BorrowRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear() - 2, 0, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
          },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.quarter': 1 } }
    ]);

    // Yearly data (last 5 years)
    const yearlyData = await BorrowRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear() - 5, 0, 1) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1 } }
    ]);

    // Also get new books data for the same periods
    const monthlyBooks = await Book.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newBooks: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
      monthly: monthlyData.map(item => ({
        period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        totalRequests: item.totalRequests,
        approvedRequests: item.approvedRequests,
        completedRequests: item.completedRequests,
        newBooks: monthlyBooks.find(book => 
          book._id.year === item._id.year && book._id.month === item._id.month
        )?.newBooks || 0
      })),
      quarterly: quarterlyData.map(item => ({
        period: `${item._id.year}-Q${item._id.quarter}`,
        totalRequests: item.totalRequests,
        approvedRequests: item.approvedRequests,
        completedRequests: item.completedRequests
      })),
      yearly: yearlyData.map(item => ({
        period: item._id.year.toString(),
        totalRequests: item.totalRequests,
        approvedRequests: item.approvedRequests,
        completedRequests: item.completedRequests
      }))
    };
  } catch (error) {
    console.error('Error getting book sharing activity:', error);
    return { monthly: [], quarterly: [], yearly: [] };
  }
}