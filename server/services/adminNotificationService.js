/**
 * Admin Notification Service
 * Handles real-time notifications for admin dashboard activities
 */

class AdminNotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Emit notification to all connected admin users
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emitToAdmins(event, data = {}) {
    if (!this.io) {
      console.warn('Socket.io not initialized for admin notifications');
      return;
    }

    // Emit to admin room
    this.io.to('admin-room').emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    console.log(`📢 Admin notification emitted: ${event}`, data);
  }

  /**
   * Notify admins of new borrow request
   */
  notifyNewBorrowRequest(borrowRequest) {
    this.emitToAdmins('borrow_request:new', {
      borrowRequestId: borrowRequest._id,
      bookTitle: borrowRequest.book?.title,
      borrowerName: borrowRequest.borrower?.name,
      status: borrowRequest.status
    });
  }

  /**
   * Notify admins of new user registration
   */
  notifyNewUser(user) {
    this.emitToAdmins('user:new', {
      userId: user._id,
      userName: user.name,
      userEmail: user.email
    });
  }

  /**
   * Notify admins of new book added
   */
  notifyNewBook(book) {
    this.emitToAdmins('book:new', {
      bookId: book._id,
      bookTitle: book.title,
      bookAuthor: book.author,
      ownerName: book.owner?.name
    });
  }

  /**
   * Notify admins of new book for sale
   */
  notifyNewBookForSale(book) {
    this.emitToAdmins('book_for_sale:new', {
      bookId: book._id,
      bookTitle: book.title,
      bookAuthor: book.author,
      sellingPrice: book.sellingPrice,
      ownerName: book.owner?.name
    });
  }

  /**
   * Notify admins of new book club
   */
  notifyNewBookClub(club) {
    this.emitToAdmins('book_club:new', {
      clubId: club._id,
      clubName: club.name,
      creatorName: club.creator?.name
    });
  }

  /**
   * Notify admins of new organizer application
   */
  notifyNewOrganizerApplication(application) {
    this.emitToAdmins('organizer_application:new', {
      applicationId: application._id,
      applicantName: application.user?.name,
      applicantEmail: application.user?.email,
      status: application.status
    });
  }

  /**
   * Notify admins of new event
   */
  notifyNewEvent(event) {
    this.emitToAdmins('event:new', {
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      organizerName: event.organizer?.name
    });
  }

  /**
   * Notify admins of new review
   */
  notifyNewReview(review) {
    this.emitToAdmins('review:new', {
      reviewId: review._id,
      bookTitle: review.book?.title,
      rating: review.rating,
      reviewerName: review.user?.name
    });
  }

  /**
   * Notify admins of new report
   */
  notifyNewReport(report) {
    this.emitToAdmins('report:new', {
      reportId: report._id,
      reportType: report.reportType,
      reportedItemType: report.reportedItemType,
      reporterName: report.reporter?.name,
      reason: report.reason
    });
  }

  /**
   * Notify admins of borrow request status change
   */
  notifyBorrowRequestUpdate(borrowRequest) {
    this.emitToAdmins('borrow_request:update', {
      borrowRequestId: borrowRequest._id,
      bookTitle: borrowRequest.book?.title,
      status: borrowRequest.status
    });
  }

  /**
   * Notify admins of user status change
   */
  notifyUserUpdate(user) {
    this.emitToAdmins('user:update', {
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
    this.emitToAdmins('book:deleted', {
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
    this.emitToAdmins('book:updated', {
      bookId: book._id,
      bookTitle: book.title,
      bookAuthor: book.author,
      ownerName: book.owner?.name
    });
  }
}

export default AdminNotificationService;
