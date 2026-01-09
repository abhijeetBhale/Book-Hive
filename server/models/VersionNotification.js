import mongoose from 'mongoose';

const versionNotificationSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true // e.g., "v1.0.0", "v2.1.3"
  },
  title: {
    type: String,
    required: true // e.g., "New Wallet System Released!"
  },
  description: {
    type: String,
    required: true // Brief description
  },
  content: {
    type: String,
    required: true // Detailed HTML content
  },
  type: {
    type: String,
    enum: ['major', 'minor', 'patch', 'hotfix'],
    default: 'minor'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  features: [{
    title: String,
    description: String,
    icon: String // Icon name or emoji
  }],
  bugFixes: [{
    title: String,
    description: String
  }],
  improvements: [{
    title: String,
    description: String
  }],
  releaseDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  targetUsers: {
    type: [String],
    enum: ['all', 'admin', 'user', 'lender', 'borrower'],
    default: ['all']
  },
  expiresAt: {
    type: Date,
    default: null // Optional expiration date
  }
}, {
  timestamps: true
});

// Index for efficient queries
versionNotificationSchema.index({ version: 1 });
versionNotificationSchema.index({ releaseDate: -1 });
versionNotificationSchema.index({ isActive: 1 });

export default mongoose.model('VersionNotification', versionNotificationSchema);