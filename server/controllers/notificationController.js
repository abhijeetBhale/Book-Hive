import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Create a book inquiry notification (profile -> send message)
// @route   POST /api/notifications/book-inquiry
export const createBookInquiry = async (req, res) => {
  try {
    const { toUserId, subject, body } = req.body;
    if (!toUserId || !subject || !body) {
      return res.status(400).json({ message: 'toUserId, subject and body are required' });
    }

    const toUser = await User.findById(toUserId).select('_id');
    if (!toUser) return res.status(404).json({ message: 'Target user not found' });

    const snippet = String(body).slice(0, 200);
    const note = await Notification.create({
      user: toUserId,
      type: 'book_inquiry',
      message: `${req.user.name} • ${subject}: ${snippet}`,
      fromUser: req.user._id,
      link: `/users/${req.user._id}`,
    });

    return res.status(201).json({ notification: note });
  } catch (err) {
    console.error('book-inquiry create error:', err);
    return res.status(500).json({ message: 'Server error creating book inquiry' });
  }
};

// @desc    List book inquiry notifications for current user (only book inquiries)
// @route   GET /api/notifications/book-inquiry
export const listBookInquiries = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const l = Math.min(Number(limit) || 20, 50);
    const p = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Notification.find({ 
        user: req.user._id, 
        type: 'book_inquiry' // Only book inquiries, not chat messages
      })
        .populate('fromUser', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      Notification.countDocuments({ 
        user: req.user._id, 
        type: 'book_inquiry' 
      }),
    ]);

    return res.json({ notifications: items, total, page: p, limit: l });
  } catch (err) {
    console.error('book-inquiry list error:', err);
    return res.status(500).json({ message: 'Server error listing book inquiries' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/count
export const getUnreadCount = async (req, res) => {
  try {
    console.log('Getting unread count for user:', req.user._id);
    
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: { $ne: true }
    });
    
    console.log('Unread notification count:', count);
    return res.json({ count });
  } catch (err) {
    console.error('notification count error:', err);
    return res.status(500).json({ message: 'Server error getting notification count' });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/mark-read
export const markRead = async (req, res) => {
  try {
    console.log('Mark read request:', { 
      body: req.body, 
      user: req.user?._id || req.user?.id,
      userObject: req.user 
    });
    
    // Ensure we have a user
    if (!req.user || (!req.user._id && !req.user.id)) {
      console.error('No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id || req.user.id;
    const { notificationIds } = req.body || {};
    
    let result;
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      console.log('Marking specific notifications as read:', notificationIds);
      result = await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          user: userId
        },
        { $set: { read: true } }
      );
      console.log(`Marked ${result.modifiedCount} specific notifications as read`);
    } else {
      // Mark all notifications as read
      console.log('Marking all notifications as read for user:', userId);
      result = await Notification.updateMany(
        { 
          user: userId, 
          read: { $ne: true } 
        },
        { $set: { read: true } }
      );
      console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
    }
    
    // Get updated count
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: { $ne: true }
    });
    
    console.log('Updated unread count:', unreadCount);
    
    return res.json({ 
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount,
      unreadCount,
      success: true
    });
  } catch (err) {
    console.error('mark read error:', err);
    console.error('Error stack:', err.stack);
    console.error('Request details:', {
      method: req.method,
      url: req.url,
      body: req.body,
      user: req.user
    });
    return res.status(500).json({ 
      message: 'Server error marking notifications as read', 
      error: err.message,
      success: false
    });
  }
};

// @desc    Get all notifications for current user
// @route   GET /api/notifications
export const getAllNotifications = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const l = Math.min(Number(limit) || 20, 50);
    const p = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Notification.find({ user: req.user._id })
        .populate('fromUser', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      Notification.countDocuments({ user: req.user._id }),
    ]);

    return res.json({ notifications: items, total, page: p, limit: l });
  } catch (err) {
    console.error('get all notifications error:', err);
    return res.status(500).json({ message: 'Server error getting notifications' });
  }
};

// @desc    Create a test notification (for development)
// @route   POST /api/notifications/test
export const createTestNotification = async (req, res) => {
  try {
    const notification = await Notification.create({
      user: req.user._id,
      type: 'test',
      message: 'This is a test notification to verify the system is working!',
      fromUser: req.user._id,
      link: '/profile'
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('new_notification', {
        id: notification._id,
        type: 'test',
        message: 'Test notification created successfully!',
        fromUser: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar
        },
        link: '/profile',
        createdAt: notification.createdAt,
        read: false
      });
    }

    return res.status(201).json({ 
      message: 'Test notification created successfully!',
      notification 
    });
  } catch (err) {
    console.error('create test notification error:', err);
    return res.status(500).json({ message: 'Server error creating test notification' });
  }
};

// @desc    Delete a notification (only owner)
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Notification.findByIdAndDelete(note._id);
    return res.json({ message: 'Notification removed' });
  } catch (err) {
    console.error('notification delete error:', err);
    return res.status(500).json({ message: 'Server error deleting notification' });
  }
};