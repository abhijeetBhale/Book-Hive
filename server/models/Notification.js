import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'warning', 
      'ban', 
      'account_deleted', 
      'info', 
      'success',
      'borrow_request',
      'request_approved',
      'request_denied',
      'review_prompt',
      'friend_request',
      'friend_accepted',
      'message',
      'book_returned',
      'overdue_reminder',
      'event_invitation',
      'event_reminder',
      'due_reminder',
      'borrower_reminder',
      'broadcast_created',
      'broadcast_response',
      'broadcast_confirmed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;