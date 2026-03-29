import AdminNotification from '../models/AdminNotification.js';

/**
 * Enhanced Admin Notification Service
 * Handles real-time notifications for admin dashboard activities with database persistence
 */

class AdminNotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create and emit notification to all connected admin users
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} category - Admin dashboard category
   * @param {object} data - Additional data
   * @param {string} priority - Notification priority
   * @param {string} entityType - Entity type that triggered notification
   * @param {string} entityId - Entity ID that triggered notification
   */
  async createNotification(type, title, message, category, data = {}, priority = 'medium', entityType = null, entityId = null) {
    try {
      // Create notification in database
      const notification = await AdminNotification.create({
        type,
        title,
        message,
        category,
        priority,
        data,
        entityType,
        entityId
      });

      // Emit to admin room
      const eventData = {
        id: notification._id,
        type,
        title,
        message,
        category,
        priority,
        data,
        timestamp: notification.createdAt.toISOString()
      };
      
      console.log(`📢 Emitting admin notification: ${type}`, eventData);
      this.emitToAdmins(type, eventData);
      
      return notification;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      // Still emit real-time notification even if DB save fails
      this.emitToAdmins(type, {
        type,
        title,
        message,
        category,
        priority,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }
  /**
   * Emit notification to all connected admin users
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emitToAdmins(event, data = {}) {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized for admin notifications');
      return;
    }

    // Emit to admin room
    const eventData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    console.log(`📢 Emitting admin notification: ${event}`, eventData);
    this.io.to('admin-room').emit(event, eventData);
    
    // Also log how many admins are in the room
    const adminRoom = this.io.sockets.adapter.rooms.get('admin-room');
    const adminCount = adminRoom ? adminRoom.size : 0;
    console.log(`👥 Admin room has ${adminCount} connected admin(s)`);
  }

  /**
   * Get unread notification counts by category
   */
  async getUnreadCounts() {
    try {
      return await AdminNotification.getUnreadCountByCategory();
    } catch (error) {
      console.error('Error getting unread notification counts:', error);
      return {};
    }
  }

  /**
   * Mark notifications as read for a category
   */
  async markCategoryAsRead(category) {
    try {
      await AdminNotification.updateMany(
        { category, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      console.log(`Marked all notifications in category '${category}' as read`);
    } catch (error) {
      console.error(`Error marking category '${category}' as read:`, error);
    }
  }

  /**
   * Get recent notifications with pagination
   */
  async getRecentNotifications(page = 1, limit = 20, category = null) {
    try {
      const query = category ? { category } : {};
      const skip = (page - 1) * limit;
      
      const notifications = await AdminNotification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('entityId')
        .lean();
      
      const total = await AdminNotification.countDocuments(query);
      
      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      return { notifications: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
    }
  }

  /**
   * Notify admins of new borrow request
   */
  async notifyNewBorrowRequest(borrowRequest) {
    await this.createNotification(
      'borrow_request_new',
      'New Borrow Request',
      `${borrowRequest.borrower?.name} requested "${borrowRequest.book?.title}"`,
      'borrows',
      {
        borrowRequestId: borrowRequest._id,
        bookTitle: borrowRequest.book?.title,
        borrowerName: borrowRequest.borrower?.name,
        status: borrowRequest.status
      },
      'medium',
      'BorrowRequest',
      borrowRequest._id
    );
  }

  /**
   * Notify admins of new user registration
   */
  async notifyNewUser(user) {
    await this.createNotification(
      'user_new',
      'New User Registration',
      `${user.name} (${user.email}) joined BookHive`,
      'users',
      {
        userId: user._id,
        userName: user.name,
        userEmail: user.email
      },
      'low',
      'User',
      user._id
    );
  }

  /**
   * Notify admins of new book added
   */
  async notifyNewBook(book) {
    await this.createNotification(
      'book_new',
      'New Book Added',
      `"${book.title}" by ${book.author} added by ${book.owner?.name}`,
      'books',
      {
        bookId: book._id,
        bookTitle: book.title,
        bookAuthor: book.author,
        ownerName: book.owner?.name
      },
      'low',
      'Book',
      book._id
    );
  }

  /**
   * Notify admins of new book for sale
   */
  async notifyNewBookForSale(book) {
    await this.createNotification(
      'book_for_sale_new',
      'New Book for Sale',
      `"${book.title}" listed for ₹${book.sellingPrice} by ${book.owner?.name}`,
      'books-for-sale',
      {
        bookId: book._id,
        bookTitle: book.title,
        bookAuthor: book.author,
        sellingPrice: book.sellingPrice,
        ownerName: book.owner?.name
      },
      'low',
      'Book',
      book._id
    );
  }

  /**
   * Notify admins of new book club
   */
  async notifyNewBookClub(club) {
    await this.createNotification(
      'book_club_new',
      'New Book Club Created',
      `"${club.name}" created by ${club.creator?.name}`,
      'clubs',
      {
        clubId: club._id,
        clubName: club.name,
        creatorName: club.creator?.name
      },
      'low',
      'BookClub',
      club._id
    );
  }

  /**
   * Notify admins of new organizer application
   */
  async notifyNewOrganizerApplication(application) {
    await this.createNotification(
      'organizer_application_new',
      'New Organizer Application',
      `${application.user?.name} applied to become an organizer`,
      'organizer-applications',
      {
        applicationId: application._id,
        applicantName: application.user?.name,
        applicantEmail: application.user?.email,
        status: application.status
      },
      'medium',
      'OrganizerApplication',
      application._id
    );
  }

  /**
   * Notify admins of new event
   */
  async notifyNewEvent(event) {
    await this.createNotification(
      'event_new',
      'New Event Created',
      `"${event.title}" scheduled for ${new Date(event.date).toLocaleDateString()}`,
      'events',
      {
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        organizerName: event.organizer?.name
      },
      'low',
      'Event',
      event._id
    );
  }

  /**
   * Notify admins of new review
   */
  async notifyNewReview(review) {
    await this.createNotification(
      'review_new',
      'New Review Posted',
      `${review.user?.name} gave ${review.rating}⭐ for "${review.book?.title}"`,
      'reviews',
      {
        reviewId: review._id,
        bookTitle: review.book?.title,
        rating: review.rating,
        reviewerName: review.user?.name
      },
      'low',
      'Review',
      review._id
    );
  }

  /**
   * Notify admins of new report
   */
  async notifyNewReport(report) {
    await this.createNotification(
      'report_new',
      'New Report Submitted',
      `${report.reporter?.name} reported: ${report.reason}`,
      'reports',
      {
        reportId: report._id,
        reportType: report.reportType,
        reportedItemType: report.reportedItemType,
        reporterName: report.reporter?.name,
        reason: report.reason
      },
      'high',
      'Report',
      report._id
    );
  }

  /**
   * Notify admins of verification application
   */
  async notifyNewVerificationApplication(application) {
    await this.createNotification(
      'verification_application_new',
      'New Verification Application',
      `${application.user?.name} applied for account verification`,
      'verification',
      {
        applicationId: application._id,
        applicantName: application.user?.name,
        applicantEmail: application.user?.email,
        status: application.status
      },
      'medium',
      'VerificationApplication',
      application._id
    );
  }

  /**
   * Notify admins of new withdrawal request
   */
  async notifyNewWithdrawalRequest(withdrawalRequest) {
    await this.createNotification(
      'withdrawal_request_new',
      'New Withdrawal Request',
      `${withdrawalRequest.user?.name} requested ₹${withdrawalRequest.amount} withdrawal`,
      'wallet-management',
      {
        requestId: withdrawalRequest._id,
        userId: withdrawalRequest.userId,
        userName: withdrawalRequest.user?.name,
        amount: withdrawalRequest.amount,
        status: withdrawalRequest.status
      },
      'medium',
      'WalletTransaction',
      withdrawalRequest._id
    );
  }

  /**
   * Notify admins of new lending fee
   */
  async notifyNewLendingFee(lendingFee) {
    await this.createNotification(
      'lending_fee_new',
      'New Lending Fee Payment',
      `₹${lendingFee.amount} fee paid for "${lendingFee.book?.title}"`,
      'lending-fees',
      {
        feeId: lendingFee._id,
        borrowRequestId: lendingFee.borrowRequest,
        amount: lendingFee.amount,
        borrowerName: lendingFee.borrower?.name,
        lenderName: lendingFee.lender?.name,
        bookTitle: lendingFee.book?.title
      },
      'low',
      'BorrowRequest',
      lendingFee.borrowRequest
    );
  }

  /**
   * Notify admins of damage report
   */
  async notifyNewDamageReport(damageReport) {
    await this.createNotification(
      'damage_report_new',
      'New Damage Report',
      `Damage reported for "${damageReport.book?.title}" - ${damageReport.damageType}`,
      'reports',
      {
        reportId: damageReport._id,
        bookTitle: damageReport.book?.title,
        damageType: damageReport.damageType,
        reporterName: damageReport.reporter?.name,
        penaltyAmount: damageReport.penaltyAmount
      },
      'high',
      'DamageReport',
      damageReport._id
    );
  }

  /**
   * Notify admins of borrow request status change
   */
  notifyBorrowRequestUpdate(borrowRequest) {
    this.emitToAdmins('borrow_request_updated', {
      borrowRequestId: borrowRequest._id,
      bookTitle: borrowRequest.book?.title,
      status: borrowRequest.status
    });
  }

  /**
   * Notify admins of user status change
   */
  notifyUserUpdate(user) {
    this.emitToAdmins('user_updated', {
      userId: user._id,
      userName: user.name,
      isActive: user.isActive,
      role: user.role
    });
  }

  /**
   * Notify admins of book deletion
   */
  notifyBookDeleted(book) {
    this.emitToAdmins('book_deleted', {
      bookId: book._id,
      bookTitle: book.title,
      bookAuthor: book.author,
      ownerName: book.owner?.name
    });
  }

  /**
   * Notify admins of book update
   */
  notifyBookUpdated(book) {
    this.emitToAdmins('book_updated', {
      bookId: book._id,
      bookTitle: book.title,
      bookAuthor: book.author,
      ownerName: book.owner?.name
    });
  }

  /**
   * Notify admins of new withdrawal request
   */
  notifyNewWithdrawalRequest(withdrawalRequest) {
    this.emitToAdmins('withdrawal_request_new', {
      requestId: withdrawalRequest._id,
      userId: withdrawalRequest.userId,
      userName: withdrawalRequest.user?.name,
      amount: withdrawalRequest.amount,
      status: withdrawalRequest.status
    });
  }

  /**
   * Notify admins of withdrawal request status change
   */
  notifyWithdrawalRequestUpdate(withdrawalRequest) {
    this.emitToAdmins('withdrawal_request_updated', {
      requestId: withdrawalRequest._id,
      userId: withdrawalRequest.userId,
      userName: withdrawalRequest.user?.name,
      amount: withdrawalRequest.amount,
      status: withdrawalRequest.status
    });
  }

  /**
   * Notify admins of new wallet transaction
   */
  notifyNewWalletTransaction(transaction) {
    this.emitToAdmins('wallet_transaction_new', {
      transactionId: transaction._id,
      userId: transaction.userId,
      userName: transaction.user?.name,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description
    });
  }

  /**
   * Notify admins of new lending fee
   */
  notifyNewLendingFee(lendingFee) {
    this.emitToAdmins('lending_fee_new', {
      feeId: lendingFee._id,
      borrowRequestId: lendingFee.borrowRequest,
      amount: lendingFee.amount,
      borrowerName: lendingFee.borrower?.name,
      lenderName: lendingFee.lender?.name,
      bookTitle: lendingFee.book?.title
    });
  }

  /**
   * Notify admins of verification application status change
   */
  notifyVerificationApplicationUpdate(application) {
    this.emitToAdmins('verification_application_updated', {
      applicationId: application._id,
      applicantName: application.user?.name,
      applicantEmail: application.user?.email,
      status: application.status
    });
  }
}

export default AdminNotificationService;
