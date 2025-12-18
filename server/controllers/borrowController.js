import BorrowRequest from '../models/BorrowRequest.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { awardPoints, updateUserStatsAndAchievements } from '../services/achievementService.js';
import { sendOverdueReminders } from '../services/reminderService.js';

// @desc    Request to borrow a book
// @route   POST /api/borrow/request/:bookId
export const requestBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.owner.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: 'You cannot borrow your own book' });
    }
    if (!book.forBorrowing) {
      return res
        .status(400)
        .json({ message: 'This book is not available for borrowing' });
    }
    if (!book.isAvailable) {
      return res
        .status(400)
        .json({ message: 'This book is currently unavailable' });
    }

    // Check for existing pending request
    const existingRequest = await BorrowRequest.findOne({
      book: req.params.bookId,
      borrower: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: 'You have already requested this book' });
    }

    // ============================================
    // PREMIUM FEATURE: DISABLED FOR DEVELOPMENT
    // ============================================
    // Uncomment this section when ready to enable premium limits
    /*
    const User = (await import('../models/User.js')).default;
    const currentUser = await User.findById(req.user._id);
    const maxBooksLimit = currentUser.premiumFeatures?.maxBooksLimit || 1;
    
    // Count currently active borrows (approved and not returned)
    const activeBorrows = await BorrowRequest.countDocuments({
      borrower: req.user._id,
      status: 'approved',
      returnedAt: { $exists: false }
    });

    if (activeBorrows >= maxBooksLimit) {
      const upgradeMessage = maxBooksLimit === 1 
        ? 'You can only borrow 1 book at a time. Upgrade to Premium Verified to borrow up to 3 books simultaneously!'
        : `You have reached your limit of ${maxBooksLimit} books. Please return a book before borrowing another.`;
      
      return res.status(400).json({ 
        message: upgradeMessage,
        code: 'BORROW_LIMIT_REACHED',
        currentLimit: maxBooksLimit,
        activeBorrows: activeBorrows,
        isPremium: currentUser.isVerified || false
      });
    }
    */
    const borrowRequest = new BorrowRequest({
      book: req.params.bookId,
      borrower: req.user._id,
      owner: book.owner,
      depositStatus: book.securityDeposit > 0 ? 'pending' : 'not_required',
      depositAmount: book.securityDeposit || 0,
      lendingFee: book.lendingFee || 0,
      lendingFeeStatus: book.lendingFee > 0 ? 'pending' : 'not_required',
      platformFee: book.lendingFee > 0 ? Math.round((book.lendingFee * 0.2) * 100) / 100 : 0,
      ownerEarnings: book.lendingFee > 0 ? Math.round((book.lendingFee * 0.8) * 100) / 100 : 0
    });
    await borrowRequest.save();
    
    // Get populated book data for notifications
    const populatedBook = await Book.findById(book._id).populate('owner', 'name avatar isVerified');
    
    // Notify admins of new borrow request
    try {
      const adminNotificationService = req.app.get('adminNotificationService');
      if (adminNotificationService) {
        const populatedRequest = await BorrowRequest.findById(borrowRequest._id)
          .populate('book', 'title')
          .populate('borrower', 'name');
        adminNotificationService.notifyNewBorrowRequest(populatedRequest);
      }
    } catch (adminNotifError) {
      console.error('Failed to send admin notification for new borrow request:', adminNotifError);
    }
    
    // Create a notification for the book owner
    try {
      const ownerNotification = await Notification.create({
        userId: book.owner,
        type: 'borrow_request',
        title: 'New Borrow Request',
        message: `${req.user.name} wants to borrow "${book.title}" from you`,
        fromUserId: req.user._id,
        link: '/borrow-requests',
        metadata: {
          bookId: book._id,
          bookTitle: book.title,
          borrowRequestId: borrowRequest._id
        }
      });

      // Emit real-time notification via WebSocket to owner
      try {
        const io = req.app.get('io');
        if (io) {
          const ownerNotificationData = {
            id: ownerNotification._id,
            type: 'borrow_request',
            message: `You have a new borrow request from ${req.user.name}!`,
            fromUser: {
              _id: req.user._id,
              name: req.user.name,
              avatar: req.user.avatar
            },
            book: {
              _id: book._id,
              title: book.title,
              coverImage: book.coverImage
            },
            link: '/borrow-requests',
            createdAt: ownerNotification.createdAt,
            read: false
          };

          console.log(`Emitting notification to owner user:${book.owner}`, ownerNotificationData);
          io.to(`user:${book.owner}`).emit('new_notification', ownerNotificationData);
          // Emit badge update event
          io.to(`user:${book.owner}`).emit('borrow_request:new', { borrowRequestId: borrowRequest._id });
        } else {
          console.warn('Socket.IO instance not available');
        }
      } catch (socketError) {
        console.error('Failed to emit new_notification event to owner:', socketError.message);
      }
    } catch (e) {
      // Log and continue; do not fail the main action due to notification issues
      console.error('Failed to create borrow_request notification for owner:', e.message);
    }

    // Create a confirmation notification for the borrower (person requesting the book)
    try {
      const borrowerNotification = await Notification.create({
        userId: req.user._id,
        type: 'info',
        title: 'Borrow Request Sent',
        message: `Your request to borrow "${book.title}" from ${populatedBook.owner.name} has been sent successfully. You'll be notified when they respond.`,
        fromUserId: book.owner,
        link: '/borrow-requests',
        metadata: {
          bookId: book._id,
          bookTitle: book.title,
          borrowRequestId: borrowRequest._id,
          ownerId: book.owner
        }
      });

      // Emit real-time notification via WebSocket to borrower
      try {
        const io = req.app.get('io');
        if (io) {
          const borrowerNotificationData = {
            id: borrowerNotification._id,
            type: 'info',
            message: `Your request to borrow "${book.title}" has been sent successfully!`,
            fromUser: {
              _id: populatedBook.owner._id,
              name: populatedBook.owner.name,
              avatar: populatedBook.owner.avatar
            },
            book: {
              _id: book._id,
              title: book.title,
              coverImage: book.coverImage
            },
            link: '/borrow-requests',
            createdAt: borrowerNotification.createdAt,
            read: false
          };

          console.log(`Emitting confirmation notification to borrower user:${req.user._id}`, borrowerNotificationData);
          io.to(`user:${req.user._id}`).emit('new_notification', borrowerNotificationData);
          // Emit badge update event
          io.to(`user:${req.user._id}`).emit('borrow_request:sent', { borrowRequestId: borrowRequest._id });
        }
      } catch (socketError) {
        console.error('Failed to emit confirmation notification to borrower:', socketError.message);
      }
    } catch (e) {
      // Log and continue; do not fail the main action due to notification issues
      console.error('Failed to create confirmation notification for borrower:', e.message);
    }

    res.status(201).json({ 
      message: 'Borrow request sent',
      borrowRequestId: borrowRequest._id,
      success: true
    });
  } catch (error) {
    console.error('Request book error:', error);
    res.status(500).json({ message: 'Server error requesting book' });
  }
};

// @desc    Accept a borrow request
// @route   PUT /api/borrow/accept/:requestId
export const acceptRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    request.status = 'approved';
    await request.save();

    // Mark book as booked with a future date (default 14 days from now if dueDate is missing)
    const defaultUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await Book.findByIdAndUpdate(request.book, {
      $set: {
        isBooked: true,
        bookedFrom: new Date(),
        bookedUntil: request.dueDate || defaultUntil,
        currentBorrowRequest: request._id,
      }
    });

    res.json({ message: 'Borrow request accepted and book marked as booked' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error accepting request' });
  }
};

// @desc    Return a borrowed book
// @route   PUT /api/borrow/:requestId/return
export const returnBook = async (req, res) => {
  try {
    const borrowRequest = await BorrowRequest.findById(req.params.requestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    // Check if the current user is the borrower
    if (borrowRequest.borrower.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to return this book' });
    }

    if (borrowRequest.status !== 'borrowed') {
      return res.status(400).json({ message: 'Book is not currently borrowed' });
    }

    borrowRequest.status = 'returned';
    await borrowRequest.save();

    // Clear booking flags on the book
    await Book.findByIdAndUpdate(borrowRequest.book, {
      $set: {
        isAvailable: true,
        isBooked: false,
        bookedFrom: null,
        bookedUntil: null,
        currentBorrowRequest: null,
      }
    });

    // Award points for successful book return
    await awardPoints(req.user._id, 'book_returned', 5);

    // Review prompt notifications for both users
    try {
      await Notification.create({
        userId: borrowRequest.owner,
        type: 'review_prompt',
        title: 'Review Request',
        message: 'Your book was returned. Please review the borrower.',
        fromUserId: borrowRequest.borrower,
        link: '/borrow-requests',
        metadata: {
          borrowRequestId: borrowRequest._id
        }
      });
      await Notification.create({
        userId: borrowRequest.borrower,
        type: 'review_prompt',
        title: 'Review Request',
        message: 'You returned a book. Please review the lender.',
        fromUserId: borrowRequest.owner,
        link: '/borrow-requests',
        metadata: {
          borrowRequestId: borrowRequest._id
        }
      });
    } catch (e) {
      console.error('Failed to create review prompt notifications:', e.message);
    }

    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ message: 'Server error returning book' });
  }
};

// @desc    Get received borrow requests (for my books)
// @route   GET /api/borrow/received-requests
export const getReceivedRequests = async (req, res) => {
  try {
    // Premium feature: Priority queue - verified users' requests appear first
    const requests = await BorrowRequest.aggregate([
      { $match: { owner: req.user._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'borrower',
          foreignField: '_id',
          as: 'borrowerData'
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'bookData'
        }
      },
      {
        $addFields: {
          borrowerVerified: { 
            $cond: [
              { $eq: [{ $arrayElemAt: ['$borrowerData.isVerified', 0] }, true] },
              1,
              0
            ]
          },
          borrower: { $arrayElemAt: ['$borrowerData', 0] },
          book: { $arrayElemAt: ['$bookData', 0] }
        }
      },
      {
        $sort: {
          borrowerVerified: -1, // Verified users first
          createdAt: -1 // Then by creation date
        }
      },
      {
        $project: {
          borrowerData: 0,
          bookData: 0,
          borrowerVerified: 0,
          'borrower.password': 0,
          'borrower.securitySettings': 0,
          'borrower.premiumFeatures': 0
        }
      }
    ]);

    res.json({ requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ message: 'Server error getting received requests' });
  }
};

// @desc    Get my borrow requests
// @route   GET /api/borrow/my-requests
export const getMyRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ borrower: req.user._id })
      .populate('book', 'title coverImage')
      .populate('owner', 'name email avatar isVerified')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error getting my requests' });
  }
};

// @desc    Update request status
// @route   PUT /api/borrow/:requestId
export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BorrowRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the owner can approve/deny requests
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    // Populate request data for notifications
    const populatedRequest = await BorrowRequest.findById(request._id)
      .populate('book', 'title coverImage')
      .populate('borrower', 'name avatar isVerified')
      .populate('owner', 'name avatar isVerified');

    if (status === 'approved') {
      const defaultUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await Book.findByIdAndUpdate(request.book, {
        $set: {
          isBooked: true,
          bookedFrom: new Date(),
          bookedUntil: request.dueDate || defaultUntil,
          currentBorrowRequest: request._id,
        }
      });

      // Create or find existing conversation between borrower and owner
      let conversation = await Conversation.findOne({
        participants: { $all: [populatedRequest.borrower._id, populatedRequest.owner._id] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [populatedRequest.borrower._id, populatedRequest.owner._id]
        });
      }

      // Create an automatic system message about the approved book request
      const systemMessage = await Message.create({
        conversationId: conversation._id,
        senderId: populatedRequest.owner._id,
        recipientId: populatedRequest.borrower._id,
        subject: 'Book Request Approved',
        message: `📚 Great news! Your request to borrow "${populatedRequest.book.title}" has been approved! Let's coordinate the book exchange. When would be a good time for you to pick up the book?`,
        messageType: 'system'
      });

      // Update the borrow request with conversation info
      await BorrowRequest.findByIdAndUpdate(request._id, {
        communicationStarted: true,
        conversationId: conversation._id
      });

      // Notify borrower that their request was approved
      try {
        const notification = await Notification.create({
          userId: populatedRequest.borrower._id,
          type: 'request_approved',
          title: 'Request Approved',
          message: `Your request to borrow "${populatedRequest.book.title}" was approved! Check your messages to coordinate pickup.`,
          fromUserId: req.user._id,
          link: '/messages',
          metadata: {
            bookId: populatedRequest.book._id,
            bookTitle: populatedRequest.book.title,
            borrowRequestId: request._id
          }
        });

        const io = req.app.get('io');
        if (io) {
          const notificationData = {
            id: notification._id,
            type: 'request_approved',
            message: `Great news! Your request to borrow "${populatedRequest.book.title}" was approved! Check messages to coordinate.`,
            fromUser: {
              _id: req.user._id,
              name: req.user.name,
              avatar: req.user.avatar
            },
            book: {
              _id: populatedRequest.book._id,
              title: populatedRequest.book.title,
              coverImage: populatedRequest.book.coverImage
            },
            link: '/messages',
            createdAt: notification.createdAt,
            read: false
          };

          console.log(`Emitting approval notification to user:${populatedRequest.borrower._id}`);
          io.to(`user:${populatedRequest.borrower._id}`).emit('new_notification', notificationData);
          // Emit badge update event
          io.to(`user:${populatedRequest.borrower._id}`).emit('borrow_request:updated');
          io.to(`user:${populatedRequest.owner._id}`).emit('borrow_request:updated');

          // Also emit the new message to both users
          const messageData = {
            _id: systemMessage._id,
            conversationId: conversation._id,
            senderId: { _id: populatedRequest.owner._id, name: populatedRequest.owner.name, avatar: populatedRequest.owner.avatar },
            recipientId: { _id: populatedRequest.borrower._id },
            subject: systemMessage.subject,
            message: systemMessage.message,
            messageType: 'system',
            createdAt: systemMessage.createdAt,
            status: 'delivered'
          };

          io.to(`user:${populatedRequest.borrower._id}`).emit('message:new', messageData);
          io.to(`user:${populatedRequest.owner._id}`).emit('message:new', messageData);
        }
      } catch (e) {
        console.error('Failed to create/emit approval notification:', e.message);
      }
    }

    if (status === 'denied') {
      // Notify borrower that their request was denied
      try {
        const notification = await Notification.create({
          userId: populatedRequest.borrower._id,
          type: 'request_denied',
          title: 'Request Declined',
          message: `Your request to borrow "${populatedRequest.book.title}" was declined`,
          fromUserId: req.user._id,
          link: '/borrow-requests',
          metadata: {
            bookId: populatedRequest.book._id,
            bookTitle: populatedRequest.book.title,
            borrowRequestId: request._id
          }
        });

        const io = req.app.get('io');
        if (io) {
          const notificationData = {
            id: notification._id,
            type: 'request_denied',
            message: `Your request to borrow "${populatedRequest.book.title}" was declined`,
            fromUser: {
              _id: req.user._id,
              name: req.user.name,
              avatar: req.user.avatar
            },
            book: {
              _id: populatedRequest.book._id,
              title: populatedRequest.book.title,
              coverImage: populatedRequest.book.coverImage
            },
            link: '/borrow-requests',
            createdAt: notification.createdAt,
            read: false
          };

          console.log(`Emitting denial notification to user:${populatedRequest.borrower._id}`);
          io.to(`user:${populatedRequest.borrower._id}`).emit('new_notification', notificationData);
        }
      } catch (e) {
        console.error('Failed to create/emit denial notification:', e.message);
      }
    }

    if (status === 'returned') {
      await Book.findByIdAndUpdate(request.book, {
        $set: {
          isAvailable: true,
          isBooked: false,
          bookedFrom: null,
          bookedUntil: null,
          currentBorrowRequest: null,
        }
      });
    }

    res.json({ message: `Request ${status} successfully`, request });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Server error updating request status' });
  }
};

// @desc    Mark book as borrowed (picked up)
// @route   PUT /api/borrow/:requestId/borrowed
export const markAsBorrowed = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.requestId)
      .populate('book')
      .populate('borrower', 'name email isVerified')
      .populate('owner', 'name email isVerified');

    if (!request) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (!request.book) {
      return res.status(400).json({ message: 'Book information not found for this request' });
    }

    console.log('Mark as borrowed - Request details:', {
      requestId: request._id,
      status: request.status,
      depositStatus: request.depositStatus,
      depositAmount: request.depositAmount,
      bookId: request.book?._id,
      ownerId: request.owner?._id,
      currentUserId: req.user._id
    });

    // Only owner can mark as borrowed
    const ownerId = request.owner?._id || request.owner;
    const currentUserId = req.user._id;
    
    if (ownerId.toString() !== currentUserId.toString()) {
      console.log('Authorization failed:', {
        ownerId: ownerId.toString(),
        currentUserId: currentUserId.toString()
      });
      return res.status(403).json({ message: 'Not authorized. Only the book owner can mark as borrowed.' });
    }

    // Check if already borrowed
    if (request.status === 'borrowed') {
      return res.status(400).json({ 
        message: 'This book has already been marked as borrowed',
        currentStatus: request.status
      });
    }

    if (request.status !== 'approved') {
      console.log('Cannot mark as borrowed - wrong status:', {
        currentStatus: request.status,
        expectedStatus: 'approved'
      });
      return res.status(400).json({ 
        message: `Request must be approved first. Current status: ${request.status}`,
        currentStatus: request.status
      });
    }

    // ============================================
    // SECURITY DEPOSIT: DISABLED FOR DEVELOPMENT
    // ============================================
    // Uncomment this section when ready to enable deposit checks
    /*
    const requiresDeposit = request.depositAmount > 0;
    const depositNotPaid = request.depositStatus === 'pending';
    
    if (requiresDeposit && depositNotPaid) {
      console.log('Blocking mark as borrowed - deposit not paid:', {
        depositAmount: request.depositAmount,
        depositStatus: request.depositStatus
      });
      return res.status(400).json({ 
        message: 'Security deposit must be paid before borrowing',
        requiresDeposit: true,
        depositAmount: request.depositAmount,
        depositStatus: request.depositStatus
      });
    }
    */
    
    // Development mode: Skip deposit check
    console.log('Development mode: Skipping deposit check');
    console.log('Proceeding with mark as borrowed');

    // Update the request status and let the pre-save hook handle the rest
    const updatedRequest = await BorrowRequest.findById(req.params.requestId);
    updatedRequest.status = 'borrowed';
    updatedRequest.borrowedDate = new Date();
    
    // Ensure metadata is properly set
    if (!updatedRequest.metadata) {
      updatedRequest.metadata = {};
    }
    updatedRequest.metadata.handoverDate = new Date();
    
    await updatedRequest.save();

    // Award points and update stats for both users
    await Promise.all([
      // Award points to lender for lending a book
      updateUserStatsAndAchievements(request.owner._id, 'book_lent', {
        bookId: request.book._id,
        borrowerId: request.borrower._id
      }),
      // Award points to borrower for borrowing a book
      updateUserStatsAndAchievements(request.borrower._id, 'book_borrowed', {
        bookId: request.book._id,
        ownerId: request.owner._id
      })
    ]);

    res.json({ message: 'Book marked as borrowed successfully' });
  } catch (error) {
    console.error('Mark as borrowed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark book as returned
// @route   PUT /api/borrow/:requestId/returned
export const markAsReturned = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.requestId)
      .populate('book')
      .populate('borrower', 'name email isVerified')
      .populate('owner', 'name email isVerified');

    if (!request) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    // Only borrower can mark as returned
    if (request.borrower._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'borrowed') {
      return res.status(400).json({ message: 'Book must be borrowed first' });
    }

    await BorrowRequest.findByIdAndUpdate(req.params.requestId, {
      status: 'returned',
      returnedDate: new Date(),
      // If deposit was paid, mark as refunded (logical refund)
      ...(request.depositStatus === 'paid' && { depositStatus: 'refunded' })
    });

    // Update book availability
    await Book.findByIdAndUpdate(request.book._id, {
      $set: {
        isAvailable: true
      },
      $unset: {
        isBooked: 1,
        bookedFrom: 1,
        bookedUntil: 1,
        currentBorrowRequest: 1
      }
    });

    res.json({ message: 'Book marked as returned successfully' });
  } catch (error) {
    console.error('Mark as returned error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all borrow requests for calendar view
// @route   GET /api/borrow/all-requests
export const getAllBorrowRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({
      $or: [
        { borrower: req.user._id },
        { owner: req.user._id }
      ],
      status: { $in: ['approved', 'borrowed'] }
    })
      .populate('book', 'title coverImage lendingDuration')
      .populate('borrower', 'name avatar isVerified')
      .populate('owner', 'name avatar isVerified')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get all borrow requests error:', error);
    res.status(500).json({ message: 'Server error getting borrow requests' });
  }
};

// @desc    Test reminder notifications (for development)
// @route   POST /api/borrow/test-reminders
export const testReminders = async (req, res) => {
  try {
    const io = req.app.get('io');
    await sendOverdueReminders(io);
    res.json({ message: 'Reminder service executed successfully' });
  } catch (error) {
    console.error('Test reminders error:', error);
    res.status(500).json({ message: 'Server error testing reminders' });
  }
};



// @desc    Delete a borrow request (owner or borrower can delete)
// @route   DELETE /api/borrow/:requestId
export const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const requesterId = req.user._id.toString();
    if (
      request.owner.toString() !== requesterId &&
      request.borrower.toString() !== requesterId
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }
    await BorrowRequest.findByIdAndDelete(requestId);
    return res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error deleting request' });
  }
};
