import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRequest from '../models/BorrowRequest.js';
import cron from 'node-cron';

class NotificationService {
  constructor(io) {
    this.io = io;
    this.setupScheduledTasks();
  }

  // Create a notification
  async createNotification({
    userId,
    type,
    message,
    fromUserId = null,
    link = null,
    metadata = {},
    priority = 'medium',
    actionRequired = false,
    scheduledFor = null
  }) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        message,
        fromUser: fromUserId,
        link,
        metadata: {
          ...metadata,
          priority,
          actionRequired
        },
        scheduledFor,
        isScheduled: !!scheduledFor,
        deliveryStatus: scheduledFor ? 'pending' : 'sent'
      });

      // Populate fromUser for real-time emission
      await notification.populate('fromUser', 'name email avatar');

      // If not scheduled, emit immediately
      if (!scheduledFor) {
        this.emitRealTimeNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Emit real-time notification via WebSocket
  emitRealTimeNotification(userId, notification) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('new_notification', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        fromUser: notification.fromUser,
        link: notification.link,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        read: notification.read
      });
    }
  }

  // Due date reminders
  async sendDueReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find books due tomorrow
      const dueRequests = await BorrowRequest.find({
        status: 'borrowed',
        dueDate: {
          $gte: tomorrow,
          $lt: nextDay
        }
      }).populate('book borrower owner');

      for (const request of dueRequests) {
        // Notify borrower
        await this.createNotification({
          userId: request.borrower._id,
          type: 'due_reminder',
          message: `📚 Reminder: "${request.book.title}" is due tomorrow. Please return it on time!`,
          fromUserId: request.owner._id,
          link: `/borrow-requests`,
          metadata: {
            bookId: request.book._id,
            borrowRequestId: request._id,
            priority: 'high',
            actionRequired: true
          }
        });

        // Notify owner
        await this.createNotification({
          userId: request.owner._id,
          type: 'due_reminder',
          message: `📖 "${request.book.title}" borrowed by ${request.borrower.name} is due tomorrow.`,
          fromUserId: request.borrower._id,
          link: `/borrow-requests`,
          metadata: {
            bookId: request.book._id,
            borrowRequestId: request._id,
            priority: 'medium'
          }
        });
      }

      console.log(`Sent ${dueRequests.length * 2} due date reminders`);
    } catch (error) {
      console.error('Error sending due reminders:', error);
    }
  }

  // Overdue reminders
  async sendOverdueReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find overdue books
      const overdueRequests = await BorrowRequest.find({
        status: 'borrowed',
        dueDate: { $lt: today }
      }).populate('book borrower owner');

      for (const request of overdueRequests) {
        const daysOverdue = Math.ceil((today - request.dueDate) / (1000 * 60 * 60 * 24));

        // Notify borrower
        await this.createNotification({
          userId: request.borrower._id,
          type: 'overdue_reminder',
          message: `⚠️ OVERDUE: "${request.book.title}" is ${daysOverdue} day(s) overdue. Please return it immediately!`,
          fromUserId: request.owner._id,
          link: `/borrow-requests`,
          metadata: {
            bookId: request.book._id,
            borrowRequestId: request._id,
            priority: 'urgent',
            actionRequired: true
          }
        });

        // Notify owner
        await this.createNotification({
          userId: request.owner._id,
          type: 'overdue_reminder',
          message: `📚 "${request.book.title}" borrowed by ${request.borrower.name} is ${daysOverdue} day(s) overdue.`,
          fromUserId: request.borrower._id,
          link: `/borrow-requests`,
          metadata: {
            bookId: request.book._id,
            borrowRequestId: request._id,
            priority: 'high'
          }
        });
      }

      console.log(`Sent ${overdueRequests.length * 2} overdue reminders`);
    } catch (error) {
      console.error('Error sending overdue reminders:', error);
    }
  }

  // Notify users when books become available in their area
  async notifyNewBooksNearby() {
    try {
      // Get books added in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newBooks = await Book.find({
        createdAt: { $gte: yesterday },
        isAvailable: true,
        forBorrowing: true
      }).populate('owner', 'name location');

      for (const book of newBooks) {
        if (!book.owner.location || !book.owner.location.coordinates) continue;

        // Find users within 10km radius
        const nearbyUsers = await User.find({
          _id: { $ne: book.owner._id }, // Exclude book owner
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: book.owner.location.coordinates
              },
              $maxDistance: 10000 // 10km in meters
            }
          }
        });

        for (const user of nearbyUsers) {
          await this.createNotification({
            userId: user._id,
            type: 'new_book_nearby',
            message: `📚 New book "${book.title}" by ${book.author} is now available near you!`,
            fromUserId: book.owner._id,
            link: `/books/${book._id}`,
            metadata: {
              bookId: book._id,
              priority: 'low'
            }
          });
        }
      }

      console.log(`Processed ${newBooks.length} new books for nearby notifications`);
    } catch (error) {
      console.error('Error sending new books nearby notifications:', error);
    }
  }

  // Notify when a book becomes available (returned)
  async notifyBookAvailable(bookId, excludeUserId = null) {
    try {
      const book = await Book.findById(bookId).populate('owner');
      if (!book) return;

      // Find users who might be interested (could be enhanced with wishlist feature)
      const interestedUsers = await User.find({
        _id: { $ne: excludeUserId || book.owner._id }
      }).limit(10); // Limit to prevent spam

      for (const user of interestedUsers) {
        await this.createNotification({
          userId: user._id,
          type: 'availability_alert',
          message: `📖 Good news! "${book.title}" by ${book.author} is now available for borrowing!`,
          fromUserId: book.owner._id,
          link: `/books/${book._id}`,
          metadata: {
            bookId: book._id,
            priority: 'medium'
          }
        });
      }
    } catch (error) {
      console.error('Error sending availability notifications:', error);
    }
  }

  // Friend activity notifications
  async notifyFriendActivity(userId, activityType, data) {
    try {
      // Get user's friends
      const user = await User.findById(userId);
      if (!user) return;

      // This would need to be implemented based on your friends system
      // For now, we'll create a placeholder
      const friends = []; // Get friends from your friends system

      let message = '';
      let link = '';

      switch (activityType) {
        case 'book_added':
          message = `📚 ${user.name} added a new book: "${data.bookTitle}"`;
          link = `/books/${data.bookId}`;
          break;
        case 'book_reviewed':
          message = `⭐ ${user.name} reviewed "${data.bookTitle}"`;
          link = `/books/${data.bookId}`;
          break;
        case 'book_borrowed':
          message = `📖 ${user.name} borrowed "${data.bookTitle}"`;
          link = `/users/${userId}`;
          break;
        default:
          return;
      }

      for (const friend of friends) {
        await this.createNotification({
          userId: friend._id,
          type: 'friend_activity',
          message,
          fromUserId: userId,
          link,
          metadata: {
            bookId: data.bookId,
            priority: 'low'
          }
        });
      }
    } catch (error) {
      console.error('Error sending friend activity notifications:', error);
    }
  }

  // Setup scheduled tasks
  setupScheduledTasks() {
    // Send due reminders daily at 9 AM
    cron.schedule('0 9 * * *', () => {
      console.log('Running due date reminders...');
      this.sendDueReminders();
    });

    // Send overdue reminders daily at 10 AM
    cron.schedule('0 10 * * *', () => {
      console.log('Running overdue reminders...');
      this.sendOverdueReminders();
    });

    // Check for new books nearby daily at 8 AM
    cron.schedule('0 8 * * *', () => {
      console.log('Checking for new books nearby...');
      this.notifyNewBooksNearby();
    });

    // Process scheduled notifications every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.processScheduledNotifications();
    });
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        isScheduled: true,
        deliveryStatus: 'pending',
        scheduledFor: { $lte: now }
      }).populate('fromUser', 'name email avatar');

      for (const notification of scheduledNotifications) {
        // Update delivery status
        notification.deliveryStatus = 'sent';
        notification.isScheduled = false;
        await notification.save();

        // Emit real-time notification
        this.emitRealTimeNotification(notification.user, notification);
      }

      if (scheduledNotifications.length > 0) {
        console.log(`Processed ${scheduledNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  // Clean up old notifications (run weekly)
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

export default NotificationService;