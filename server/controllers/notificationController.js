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
    const count = await Notification.countDocuments({
      user: req.user._id,
      type: 'book_inquiry', // Only count book inquiries
      read: { $ne: true }
    });
    
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
    await Notification.updateMany(
      { 
        user: req.user._id, 
        type: 'book_inquiry', // Only mark book inquiries as read
        read: { $ne: true } 
      },
      { $set: { read: true } }
    );
    
    return res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('mark read error:', err);
    return res.status(500).json({ message: 'Server error marking notifications as read' });
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