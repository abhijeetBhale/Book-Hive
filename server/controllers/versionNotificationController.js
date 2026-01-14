import VersionNotification from '../models/VersionNotification.js';
import UserNotificationView from '../models/UserNotificationView.js';
import User from '../models/User.js';
import AdminNotificationService from '../services/adminNotificationService.js';

// @desc    Get unviewed notifications for current user
// @route   GET /api/notifications/unviewed
export const getUnviewedNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role || 'user';

    // Get all active notifications that target this user type
    const activeNotifications = await VersionNotification.find({
      isActive: true,
      $or: [
        { targetUsers: 'all' },
        { targetUsers: userRole }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).sort({ releaseDate: -1 });

    // Get notifications this user has already viewed
    const viewedNotifications = await UserNotificationView.find({
      userId
    }).select('notificationId');

    const viewedIds = viewedNotifications.map(v => v.notificationId.toString());

    // Filter out viewed notifications
    const unviewedNotifications = activeNotifications.filter(
      notification => !viewedIds.includes(notification._id.toString())
    );

    res.json({
      success: true,
      data: {
        notifications: unviewedNotifications,
        count: unviewedNotifications.length
      }
    });
  } catch (error) {
    console.error('Get unviewed notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

// @desc    Get notification details by ID
// @route   GET /api/notifications/:id
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await VersionNotification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Get notification by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification',
      error: error.message
    });
  }
};

// @desc    Mark notification as viewed
// @route   POST /api/notifications/:id/view
export const markNotificationAsViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { action = 'viewed' } = req.body; // 'viewed', 'dismissed', 'closed'

    // Check if notification exists
    const notification = await VersionNotification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Create or update view record
    await UserNotificationView.findOneAndUpdate(
      { userId, notificationId: id },
      { 
        action,
        viewedAt: new Date()
      },
      { 
        upsert: true,
        new: true
      }
    );

    res.json({
      success: true,
      message: `Notification marked as ${action}`,
      data: {
        notificationId: id,
        action
      }
    });
  } catch (error) {
    console.error('Mark notification as viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as viewed',
      error: error.message
    });
  }
};

// @desc    Create new version notification (admin only)
// @route   POST /api/notifications
export const createVersionNotification = async (req, res) => {
  try {
    const {
      version,
      title,
      description,
      content,
      type,
      priority,
      features,
      bugFixes,
      improvements,
      targetUsers,
      expiresAt
    } = req.body;

    const notification = new VersionNotification({
      version,
      title,
      description,
      content,
      type,
      priority,
      features: features || [],
      bugFixes: bugFixes || [],
      improvements: improvements || [],
      targetUsers: targetUsers || ['all'],
      expiresAt
    });

    await notification.save();

    // Notify admins of new version notification
    try {
      const io = req.app.get('io');
      if (io) {
        const adminNotificationService = new AdminNotificationService(io);
        adminNotificationService.notifyNewVersionNotification(notification);
      }
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Version notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create version notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications/admin/all
export const getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await VersionNotification.find()
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VersionNotification.countDocuments();

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

// @desc    Update notification (admin only)
// @route   PUT /api/notifications/:id
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await VersionNotification.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Notify admins of version notification update
    try {
      const io = req.app.get('io');
      if (io) {
        const adminNotificationService = new AdminNotificationService(io);
        adminNotificationService.notifyVersionNotificationUpdate(notification);
      }
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// @desc    Delete notification (admin only)
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await VersionNotification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Also delete all user view records for this notification
    await UserNotificationView.deleteMany({ notificationId: id });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};