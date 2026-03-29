import AdminNotification from '../models/AdminNotification.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get admin notifications with pagination and filtering
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
export const getAdminNotifications = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    category,
    type,
    priority,
    isRead,
    startDate,
    endDate
  } = req.query;

  // Build query
  let query = {};
  
  if (category) query.category = category;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (isRead !== undefined) query.isRead = isRead === 'true';
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCounts] = await Promise.all([
    AdminNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('entityId')
      .lean(),
    AdminNotification.countDocuments(query),
    AdminNotification.getUnreadCountByCategory()
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCounts,
      summary: {
        totalUnread: Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
        categoryCounts: unreadCounts
      }
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Private (Admin only)
export const markNotificationAsRead = catchAsync(async (req, res, next) => {
  const notification = await AdminNotification.findById(req.params.id);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  await notification.markAsRead();

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// @desc    Mark all notifications in category as read
// @route   PUT /api/admin/notifications/category/:category/read
// @access  Private (Admin only)
export const markCategoryAsRead = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  
  const result = await AdminNotification.updateMany(
    { category, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Get updated counts
  const unreadCounts = await AdminNotification.getUnreadCountByCategory();

  res.status(200).json({
    status: 'success',
    data: {
      message: `Marked ${result.modifiedCount} notifications as read in category '${category}'`,
      modifiedCount: result.modifiedCount,
      unreadCounts
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/read-all
// @access  Private (Admin only)
export const markAllNotificationsAsRead = catchAsync(async (req, res, next) => {
  const result = await AdminNotification.updateMany(
    { isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    status: 'success',
    data: {
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
      unreadCounts: {} // All categories now have 0 unread
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private (Admin only)
export const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await AdminNotification.findById(req.params.id);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  await AdminNotification.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get notification statistics
// @route   GET /api/admin/notifications/stats
// @access  Private (Admin only)
export const getNotificationStats = catchAsync(async (req, res, next) => {
  const { period = '7d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const [
    totalNotifications,
    unreadNotifications,
    notificationsByCategory,
    notificationsByPriority,
    notificationsByType,
    recentActivity
  ] = await Promise.all([
    AdminNotification.countDocuments({ createdAt: { $gte: startDate } }),
    AdminNotification.countDocuments({ isRead: false }),
    AdminNotification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AdminNotification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AdminNotification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    AdminNotification.find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type title message category priority createdAt')
      .lean()
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      period,
      dateRange: { startDate, endDate: now },
      summary: {
        totalNotifications,
        unreadNotifications,
        readRate: totalNotifications > 0 ? 
          Math.round(((totalNotifications - unreadNotifications) / totalNotifications) * 100) : 0
      },
      breakdown: {
        byCategory: notificationsByCategory,
        byPriority: notificationsByPriority,
        byType: notificationsByType
      },
      recentActivity
    }
  });
});

// @desc    Get unread notification counts by category
// @route   GET /api/admin/notifications/counts
// @access  Private (Admin only)
export const getNotificationCounts = catchAsync(async (req, res, next) => {
  const unreadCounts = await AdminNotification.getUnreadCountByCategory();
  
  res.status(200).json({
    status: 'success',
    data: {
      unreadCounts,
      totalUnread: Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
    }
  });
});

// @desc    Create test notification (for development/testing)
// @route   POST /api/admin/notifications/test
// @access  Private (Admin only)
export const createTestNotification = catchAsync(async (req, res, next) => {
  const {
    type = 'system_alert',
    title = 'Test Notification',
    message = 'This is a test notification created by admin',
    category = 'system',
    priority = 'low'
  } = req.body;

  const notification = await AdminNotification.create({
    type,
    title,
    message,
    category,
    priority,
    data: {
      isTest: true,
      createdBy: req.user._id,
      createdByName: req.user.name
    }
  });

  // Emit real-time notification
  if (req.app.get('adminNotificationService')) {
    req.app.get('adminNotificationService').emitToAdmins(type, {
      id: notification._id,
      type,
      title,
      message,
      category,
      priority,
      timestamp: notification.createdAt.toISOString()
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// @desc    Bulk operations on notifications
// @route   POST /api/admin/notifications/bulk
// @access  Private (Admin only)
export const bulkNotificationOperations = catchAsync(async (req, res, next) => {
  const { action, notificationIds, filters } = req.body;

  if (!action) {
    return next(new AppError('Action is required', 400));
  }

  let query = {};
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  } else if (filters) {
    // Apply filters for bulk operations
    if (filters.category) query.category = filters.category;
    if (filters.type) query.type = filters.type;
    if (filters.priority) query.priority = filters.priority;
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
  } else {
    return next(new AppError('Either notificationIds or filters must be provided', 400));
  }

  let result;

  switch (action) {
    case 'markAsRead':
      result = await AdminNotification.updateMany(
        query,
        { isRead: true, readAt: new Date() }
      );
      break;
      
    case 'markAsUnread':
      result = await AdminNotification.updateMany(
        query,
        { isRead: false, $unset: { readAt: 1 } }
      );
      break;
      
    case 'delete':
      result = await AdminNotification.deleteMany(query);
      break;
      
    default:
      return next(new AppError('Invalid action', 400));
  }

  // Get updated counts
  const unreadCounts = await AdminNotification.getUnreadCountByCategory();

  res.status(200).json({
    status: 'success',
    data: {
      action,
      modifiedCount: result.modifiedCount || result.deletedCount,
      unreadCounts
    }
  });
});