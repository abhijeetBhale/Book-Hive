import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // The user who receives the notification. This is the most important field for querying.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Indexing this field makes fetching notifications for a user much faster.
    },

    // The type of notification. This is used to filter for the dot and for organizing notifications.
    type: {
      type: String,
      required: true,
      enum: [
        'borrow_request', // When someone requests to borrow a book
        'request_accepted', // When a book owner accepts a request
        'request_declined',  // When a book owner declines a request
        'new_message',       // For the chat/messaging system
        'user_report',       // For admin/moderation purposes
        'security_alert',    // e.g., password changed, new login detected
        'profile_update',    // e.g., a system notification confirming a profile change
        'review_prompt',      // ask users to review each other after return
        'book_inquiry',       // message sent from profile "Send message" modal
        'due_reminder',       // Book due date reminder
        'overdue_reminder',   // Book overdue reminder
        'availability_alert', // Book became available
        'new_book_nearby',    // New book added in user's area
        'friend_activity',    // Friend added a book, made a review, etc.
        'club_update',        // Book club related notifications
        'system_announcement', // System-wide announcements
        'book_returned',      // Book has been returned
        'book_borrowed',      // Book has been borrowed
        'rating_received',    // User received a rating/review
      ],
    },

    // The actual text that will be displayed to the user.
    message: {
      type: String,
      required: true,
    },

    // A boolean to track if the user has seen the notification yet. Defaults to false.
    read: {
      type: Boolean,
      default: false,
    },
    
    // (Optional but recommended) The user who initiated the notification, if applicable.
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // (Optional but recommended) A URL slug to direct the user to the correct page when they click.
    link: {
      type: String,
    },

    // Additional metadata for enhanced notifications
    metadata: {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      borrowRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest' },
      conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
      clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookClub' },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      actionRequired: { type: Boolean, default: false },
      expiresAt: { type: Date }, // For time-sensitive notifications
    },

    // Delivery tracking
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },

    // For scheduled notifications
    scheduledFor: { type: Date },
    isScheduled: { type: Boolean, default: false },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields.
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;