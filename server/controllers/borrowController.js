import BorrowRequest from '../models/BorrowRequest.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';

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
    const borrowRequest = new BorrowRequest({
      book: req.params.bookId,
      borrower: req.user._id,
      owner: book.owner
    });
    await borrowRequest.save();
    // Create a notification for the book owner
    try {
      const notification = await Notification.create({
        user: book.owner,
        type: 'borrow_request',
        message: `${req.user.name} wants to borrow "${book.title}" from you`,
        fromUser: req.user._id,
        link: `/borrow-requests`
      });

      // Emit real-time notification via WebSocket
      try {
        const io = req.app.get('io');
        if (io) {
          const notificationData = {
            id: notification._id,
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
            createdAt: notification.createdAt,
            read: false
          };

          console.log(`Emitting notification to user:${book.owner}`, notificationData);
          io.to(`user:${book.owner}`).emit('new_notification', notificationData);
        } else {
          console.warn('Socket.IO instance not available');
        }
      } catch (socketError) {
        console.error('Failed to emit new_notification event:', socketError.message);
      }
    } catch (e) {
      // Log and continue; do not fail the main action due to notification issues
      console.error('Failed to create borrow_request notification:', e.message);
    }
    res.status(201).json({ message: 'Borrow request sent' });
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

    // Review prompt notifications for both users
    try {
      await Notification.create({
        user: borrowRequest.owner,
        type: 'review_prompt',
        message: 'Your book was returned. Please review the borrower.',
        fromUser: borrowRequest.borrower,
        link: `/borrow-requests`
      });
      await Notification.create({
        user: borrowRequest.borrower,
        type: 'review_prompt',
        message: 'You returned a book. Please review the lender.',
        fromUser: borrowRequest.owner,
        link: `/borrow-requests`
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
    const requests = await BorrowRequest.find({ owner: req.user._id })
      .populate('book', 'title coverImage')
      .populate('borrower', 'name email avatar')
      .sort({ createdAt: -1 });

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
      .populate('owner', 'name email avatar')
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
      .populate('borrower', 'name avatar')
      .populate('owner', 'name avatar');

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

      // Notify borrower that their request was approved
      try {
        const notification = await Notification.create({
          user: populatedRequest.borrower._id,
          type: 'request_approved',
          message: `Your request to borrow "${populatedRequest.book.title}" was approved!`,
          fromUser: req.user._id,
          link: '/borrow-requests'
        });

        const io = req.app.get('io');
        if (io) {
          const notificationData = {
            id: notification._id,
            type: 'request_approved',
            message: `Great news! Your request to borrow "${populatedRequest.book.title}" was approved!`,
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

          console.log(`Emitting approval notification to user:${populatedRequest.borrower._id}`);
          io.to(`user:${populatedRequest.borrower._id}`).emit('new_notification', notificationData);
        }
      } catch (e) {
        console.error('Failed to create/emit approval notification:', e.message);
      }
    }

    if (status === 'denied') {
      // Notify borrower that their request was denied
      try {
        const notification = await Notification.create({
          user: populatedRequest.borrower._id,
          type: 'request_denied',
          message: `Your request to borrow "${populatedRequest.book.title}" was declined`,
          fromUser: req.user._id,
          link: '/borrow-requests'
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
