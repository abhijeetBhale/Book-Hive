import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'user_new',
      'user_updated', 
      'book_new',
      'book_updated',
      'book_for_sale_new',
      'borrow_request_new',
      'borrow_request_updated',
      'book_club_new',
      'organizer_application_new',
      'event_new',
      'verification_application_new',
      'verification_application_updated',
      'review_new',
      'report_new',
      'withdrawal_request_new',
      'withdrawal_request_updated',
      'wallet_transaction_new',
      'lending_fee_new',
      'damage_report_new',
      'system_alert'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'users',
      'books', 
      'books-for-sale',
      'borrows',
      'clubs',
      'organizer-applications',
      'events',
      'verification',
      'reviews',
      'reports',
      'wallet-management',
      'lending-fees',
      'system'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Reference to the entity that triggered this notification
  entityType: {
    type: String,
    enum: ['User', 'Book', 'BorrowRequest', 'BookClub', 'Event', 'Report', 'WalletTransaction', 'VerificationApplication', 'OrganizerApplication', 'Review', 'DamageReport']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  // Auto-expire notifications after 30 days
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
adminNotificationSchema.index({ category: 1, isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });
adminNotificationSchema.index({ priority: 1, isRead: 1 });

// Virtual for notification age
adminNotificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read
adminNotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count by category
adminNotificationSchema.statics.getUnreadCountByCategory = async function() {
  const counts = await this.aggregate([
    { $match: { isRead: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const result = {};
  counts.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
};

// Static method to get recent notifications
adminNotificationSchema.statics.getRecentNotifications = async function(limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('entityId')
    .lean();
};

export default mongoose.model('AdminNotification', adminNotificationSchema);