import mongoose from 'mongoose';

const userNotificationViewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VersionNotification',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    enum: ['viewed', 'dismissed', 'closed'],
    default: 'viewed'
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per user per notification
userNotificationViewSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export default mongoose.model('UserNotificationView', userNotificationViewSchema);