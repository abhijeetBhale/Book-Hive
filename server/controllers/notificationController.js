import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get unread notifications for current user
// @route   GET /api/notifications/unread
// @access  Private
export const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      isRead: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting notifications' 
    });
  }
};

// @desc    Get moderation notifications (warnings, bans, etc.)
// @route   GET /api/notifications/moderation
// @access  Private
export const getModerationNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      type: { $in: ['warning', 'ban', 'account_deleted'] },
      isRead: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get moderation notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting moderation notifications' 
    });
  }
};

// @desc    Mark specific notifications as read or all if no IDs provided
// @route   PUT /api/notifications/mark-read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body || {};

    // If no notificationIds provided, mark all notifications as read
    if (!notificationIds || notificationIds.length === 0) {
      await Notification.updateMany(
        {
          userId: req.user._id,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

    // If notificationIds provided, mark specific notifications as read
    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs must be an array'
      });
    }

    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: req.user._id
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error marking notifications as read' 
    });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error marking all notifications as read' 
    });
  }
};

// @desc    Create a book inquiry notification
// @route   POST /api/notifications/book-inquiry
// @access  Private
export const createBookInquiry = async (req, res) => {
  try {
    const { toUserId, subject, body } = req.body;

    if (!toUserId || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'To user ID, subject, and body are required'
      });
    }

    const notification = await Notification.create({
      userId: toUserId,
      type: 'info',
      title: subject,
      message: body,
      metadata: {
        fromUserId: req.user._id,
        fromUserName: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create book inquiry error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating book inquiry' 
    });
  }
};

// @desc    List book inquiry notifications
// @route   GET /api/notifications/book-inquiry
// @access  Private
export const listBookInquiries = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const notifications = await Notification.find({
      userId: req.user._id,
      type: 'info',
      'metadata.fromUserId': { $exists: true }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    // Transform for compatibility with existing frontend
    const transformedNotifications = notifications.map(notif => ({
      _id: notif._id,
      message: notif.message,
      fromUser: {
        name: notif.metadata?.fromUserName || 'Unknown User'
      },
      createdAt: notif.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: transformedNotifications
      }
    });
  } catch (error) {
    console.error('List book inquiries error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting book inquiries' 
    });
  }
};

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
export const getAllNotifications = async (req, res) => {
  try {
    console.log('getAllNotifications called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('getAllNotifications: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { limit = 50 } = req.query;
    
    const notifications = await Notification.find({
      userId: req.user._id
    })
    .populate('fromUserId', 'name avatar email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get all notifications error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    console.log('getUnreadCount called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('getUnreadCount: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// @desc    Create test notification
// @route   POST /api/notifications/test
// @access  Private
export const createTestNotification = async (req, res) => {
  try {
    const notification = await Notification.create({
      userId: req.user._id,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification created at ' + new Date().toLocaleString()
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating test notification' 
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting notification' 
    });
  }
};

// @desc    Get notifications by type
// @route   GET /api/notifications/type/:type
// @access  Private
export const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    
    const notifications = await Notification.find({
      userId: req.user._id,
      type: type
    })
    .populate('fromUserId', 'name avatar email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting notifications by type' 
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting notification stats' 
    });
  }
};



// @desc    Clear read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
export const clearReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });

    res.status(200).json({
      success: true,
      message: 'Read notifications cleared'
    });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error clearing read notifications' 
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user notification preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating notification preferences' 
    });
  }
};