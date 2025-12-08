import BookBroadcast from '../models/BookBroadcast.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Create a new book broadcast request
// @route   POST /api/broadcasts
export const createBroadcast = async (req, res) => {
  try {
    const { bookTitle, bookAuthor, description, durationNeeded, bookCoverUrl } = req.body;

    if (!bookTitle || !durationNeeded) {
      return res.status(400).json({ message: 'Book title and duration are required' });
    }

    if (durationNeeded < 1 || durationNeeded > 365) {
      return res.status(400).json({ message: 'Duration must be between 1 and 365 days' });
    }

    const broadcast = await BookBroadcast.create({
      requester: req.user._id,
      bookTitle,
      bookAuthor,
      bookCoverUrl,
      description,
      durationNeeded
    });

    const populatedBroadcast = await BookBroadcast.findById(broadcast._id)
      .populate('requester', 'name avatar isVerified');

    // Emit real-time notification to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('broadcast:new', {
        id: populatedBroadcast._id,
        bookTitle: populatedBroadcast.bookTitle,
        bookAuthor: populatedBroadcast.bookAuthor,
        requester: {
          _id: populatedBroadcast.requester._id,
          name: populatedBroadcast.requester.name,
          avatar: populatedBroadcast.requester.avatar,
          isVerified: populatedBroadcast.requester.isVerified
        },
        durationNeeded: populatedBroadcast.durationNeeded,
        createdAt: populatedBroadcast.createdAt
      });
    }

    res.status(201).json({
      message: 'Broadcast created successfully',
      broadcast: populatedBroadcast
    });
  } catch (error) {
    console.error('Create broadcast error:', error);
    res.status(500).json({ message: 'Server error creating broadcast' });
  }
};

// @desc    Get all active broadcasts
// @route   GET /api/broadcasts
export const getAllBroadcasts = async (req, res) => {
  try {
    const broadcasts = await BookBroadcast.find({
      status: 'active',
      expiresAt: { $gt: new Date() }
    })
      .populate('requester', 'name avatar isVerified location')
      .populate('responses.responder', 'name avatar isVerified')
      .sort({ createdAt: -1 });

    res.json({ broadcasts });
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({ message: 'Server error getting broadcasts' });
  }
};

// @desc    Get my broadcasts
// @route   GET /api/broadcasts/my-broadcasts
export const getMyBroadcasts = async (req, res) => {
  try {
    const broadcasts = await BookBroadcast.find({ requester: req.user._id })
      .populate('responses.responder', 'name avatar isVerified')
      .populate('fulfilledBy', 'name avatar isVerified')
      .sort({ createdAt: -1 });

    res.json({ broadcasts });
  } catch (error) {
    console.error('Get my broadcasts error:', error);
    res.status(500).json({ message: 'Server error getting broadcasts' });
  }
};

// @desc    Respond to a broadcast
// @route   POST /api/broadcasts/:broadcastId/respond
export const respondToBroadcast = async (req, res) => {
  try {
    const { message } = req.body;
    const broadcast = await BookBroadcast.findById(req.params.broadcastId);

    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }

    if (broadcast.status !== 'active') {
      return res.status(400).json({ message: 'This broadcast is no longer active' });
    }

    if (broadcast.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot respond to your own broadcast' });
    }

    // Check if user already responded
    const alreadyResponded = broadcast.responses.some(
      r => r.responder.toString() === req.user._id.toString()
    );

    if (alreadyResponded) {
      return res.status(400).json({ message: 'You have already responded to this broadcast' });
    }

    broadcast.responses.push({
      responder: req.user._id,
      message: message || 'I have this book available'
    });

    await broadcast.save();

    const populatedBroadcast = await BookBroadcast.findById(broadcast._id)
      .populate('requester', 'name avatar isVerified')
      .populate('responses.responder', 'name avatar isVerified');

    // Notify the requester
    try {
      const notification = await Notification.create({
        userId: broadcast.requester,
        type: 'broadcast_response',
        title: 'New Response to Your Request',
        message: `${req.user.name} has the book "${broadcast.bookTitle}" available for you!`,
        fromUserId: req.user._id,
        link: '/broadcasts',
        metadata: {
          broadcastId: broadcast._id,
          bookTitle: broadcast.bookTitle
        }
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${broadcast.requester}`).emit('new_notification', {
          id: notification._id,
          type: 'broadcast_response',
          message: `${req.user.name} has "${broadcast.bookTitle}" available!`,
          fromUser: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar
          },
          link: '/broadcasts',
          createdAt: notification.createdAt,
          read: false
        });

        // Emit broadcast update
        io.to(`user:${broadcast.requester}`).emit('broadcast:response', {
          broadcastId: broadcast._id,
          responder: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
            isVerified: req.user.isVerified
          }
        });
      }
    } catch (e) {
      console.error('Failed to create notification:', e.message);
    }

    res.json({
      message: 'Response sent successfully',
      broadcast: populatedBroadcast
    });
  } catch (error) {
    console.error('Respond to broadcast error:', error);
    res.status(500).json({ message: 'Server error responding to broadcast' });
  }
};

// @desc    Confirm a responder and fulfill the broadcast
// @route   POST /api/broadcasts/:broadcastId/confirm/:responderId
export const confirmResponder = async (req, res) => {
  try {
    const { broadcastId, responderId } = req.params;
    const broadcast = await BookBroadcast.findById(broadcastId)
      .populate('requester', 'name avatar isVerified');

    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }

    if (broadcast.requester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (broadcast.status !== 'active') {
      return res.status(400).json({ message: 'This broadcast is no longer active' });
    }

    // Check if responder exists in responses
    const response = broadcast.responses.find(
      r => r.responder.toString() === responderId
    );

    if (!response) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    // Update broadcast status
    broadcast.status = 'fulfilled';
    broadcast.fulfilledBy = responderId;
    broadcast.fulfilledAt = new Date();
    await broadcast.save();

    // Create or find conversation between requester and responder
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, responderId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, responderId]
      });
    }

    // Create initial message from requester to responder
    const initialMessage = await Message.create({
      senderId: req.user._id,
      recipientId: responderId,
      subject: 'Book Request Confirmed',
      message: `Hello! 👋

Thank you so much for confirming that you have the book available for me!

📚 Book Details:
• Title: ${broadcast.bookTitle}${broadcast.bookAuthor ? `
• Author: ${broadcast.bookAuthor}` : ''}
• Duration Needed: ${broadcast.durationNeeded} day${broadcast.durationNeeded > 1 ? 's' : ''}

Could you please let me know where and when I can pick it up from you?

Looking forward to hearing from you!`,
      messageType: 'user',
      status: 'delivered'
    });

    // Add message to conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: initialMessage._id },
      updatedAt: new Date()
    });

    // Emit the message via socket to both users
    const io = req.app.get('io');
    if (io) {
      try {
        // Populate message data for socket emission
        const populatedMessage = await Message.findById(initialMessage._id)
          .populate('senderId', 'name avatar isVerified')
          .populate('recipientId', 'name avatar isVerified');

        if (populatedMessage && populatedMessage.senderId && populatedMessage.recipientId) {
          const messageData = {
            _id: populatedMessage._id,
            senderId: {
              _id: populatedMessage.senderId._id,
              name: populatedMessage.senderId.name,
              avatar: populatedMessage.senderId.avatar,
              isVerified: populatedMessage.senderId.isVerified
            },
            recipientId: {
              _id: populatedMessage.recipientId._id,
              name: populatedMessage.recipientId.name,
              avatar: populatedMessage.recipientId.avatar,
              isVerified: populatedMessage.recipientId.isVerified
            },
            subject: populatedMessage.subject,
            message: populatedMessage.message,
            messageType: populatedMessage.messageType,
            createdAt: populatedMessage.createdAt,
            status: 'delivered',
            read: false
          };

          // Emit to both users
          io.to(`user:${req.user._id}`).emit('message:new', messageData);
          io.to(`user:${responderId}`).emit('message:new', messageData);

          console.log('✅ Message emitted to both users via socket');
        }
      } catch (socketError) {
        console.error('❌ Error emitting message via socket:', socketError);
      }

      // Emit broadcast fulfilled event to all users (this will remove it from the list)
      io.emit('broadcast:fulfilled', { broadcastId: broadcast._id });
    }

    // Notify the confirmed responder
    try {
      const notification = await Notification.create({
        userId: responderId,
        type: 'broadcast_confirmed',
        title: 'You Were Selected!',
        message: `${req.user.name} confirmed you for "${broadcast.bookTitle}". Check messages to coordinate!`,
        fromUserId: req.user._id,
        link: '/messages',
        metadata: {
          broadcastId: broadcast._id,
          bookTitle: broadcast.bookTitle,
          conversationId: conversation._id
        }
      });

      if (io) {
        io.to(`user:${responderId}`).emit('new_notification', {
          id: notification._id,
          type: 'broadcast_confirmed',
          message: `You were selected for "${broadcast.bookTitle}"! Check messages.`,
          fromUser: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar
          },
          link: '/messages',
          createdAt: notification.createdAt,
          read: false
        });
      }
    } catch (e) {
      console.error('Failed to create notification:', e.message);
    }

    console.log('✅ Broadcast confirmed successfully:', {
      broadcastId: broadcast._id,
      conversationId: conversation._id,
      messageId: initialMessage._id
    });

    res.json({
      success: true,
      message: 'Responder confirmed successfully',
      conversationId: conversation._id,
      messageId: initialMessage._id
    });
  } catch (error) {
    console.error('❌ Confirm responder error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error confirming responder',
      error: error.message
    });
  }
};

// @desc    Cancel a broadcast
// @route   DELETE /api/broadcasts/:broadcastId
export const cancelBroadcast = async (req, res) => {
  try {
    const broadcast = await BookBroadcast.findById(req.params.broadcastId);

    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }

    if (broadcast.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    broadcast.status = 'cancelled';
    await broadcast.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('broadcast:cancelled', { broadcastId: broadcast._id });
    }

    res.json({ message: 'Broadcast cancelled successfully' });
  } catch (error) {
    console.error('Cancel broadcast error:', error);
    res.status(500).json({ message: 'Server error cancelling broadcast' });
  }
};
