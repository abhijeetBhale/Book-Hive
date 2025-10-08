import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ... (keep all the existing controller functions like sendMessage, getConversations, etc.)

// @desc    Send a message to a user
// @route   POST /api/messages/send/:recipientId
export const sendMessage = async (req, res) => {
  try {
    // Now correctly receiving both subject and message
    const { subject, ciphertext, iv, salt, alg, message } = req.body;
    const { recipientId } = req.params;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
      });
    }

    const newMessage = new Message({
      senderId,
      recipientId,
      subject,
      ciphertext,
      iv,
      salt,
      alg: alg || 'ECDH-AES-GCM',
      message, // temporary for migration/notifications preview
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    
    await Promise.all([conversation.save(), newMessage.save()]);

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email avatar')
      .populate('recipientId', 'name email avatar')
      .lean();


    // Emit realtime event to sender and recipient rooms
    try {
      const io = req.app.get('io');
      if (io) {
        // Emit to recipient
        io.to(`user:${recipientId}`).emit('message:new', populatedMessage);
        
        // Check if recipient is online and mark as delivered
        const recipientSocket = io.sockets.adapter.rooms.get(`user:${recipientId}`);
        if (recipientSocket && recipientSocket.size > 0) {
          // Recipient is online, mark as delivered
          await Message.findByIdAndUpdate(newMessage._id, { 
            status: 'delivered', 
            deliveredAt: new Date() 
          });
          
          // Emit delivery confirmation to sender
          io.to(`user:${senderId}`).emit('message:delivered', { 
            messageId: newMessage._id,
            deliveredAt: new Date()
          });
        }
        
        // Also emit to sender for real-time updates
        io.to(`user:${senderId}`).emit('message:new', populatedMessage);
      }
    } catch (e) {
      console.error('Failed to emit message:new event:', e.message);
    }

    // Don't create notifications for regular chat messages
    // Notifications are only for book inquiries sent from user profiles

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in sendMessage controller: ', error.message);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
export const getConversations = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const conversations = await Conversation.find({ participants: loggedInUserId })
          .populate({
            path: 'participants',
            select: 'name avatar email publicKeyJwk'
          })
          .populate({
            path: 'messages',
            options: { sort: { createdAt: -1 } },
            populate: [
              { path: 'senderId', select: 'name email avatar' },
              { path: 'recipientId', select: 'name email avatar' }
            ]
          });

        const withCounts = conversations.map((c) => {
          const obj = c.toObject();
          // Filter out messages soft-deleted by this user
          obj.messages = (obj.messages || []).filter((m) => !(m.deletedBy || []).some(id => id?.toString() === loggedInUserId.toString()));
          obj.unreadCount = (obj.messages || []).filter((m) => {
            return m && m.recipientId && m.recipientId._id?.toString() === loggedInUserId.toString() && m.read !== true;
          }).length;
          return obj;
        });

        res.status(200).json(withCounts);
    } catch (error) {
        console.error('Error in getConversations controller: ', error.message);
        res.status(500).json({ message: 'Server error getting conversations' });
    }
};

// @desc    Get conversation with a specific user (and messages with populated emails)
// @route   GET /api/messages/with/:userId
export const getConversationWithUser = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { userId } = req.params;
    let conversation = await Conversation.findOne({ participants: { $all: [loggedInUserId, userId] } })
      .populate({ path: 'participants', select: 'name avatar email publicKeyJwk' })
      .populate({
        path: 'messages',
        options: { sort: { createdAt: 1 } },
        populate: [
          { path: 'senderId', select: 'name email avatar' },
          { path: 'recipientId', select: 'name email avatar' }
        ]
      });

    if (!conversation) return res.status(200).json(null);

    // Mark recipient's unread messages as read (treat missing read as unread)
    try {
      const unreadMessages = await Message.find({
        _id: { $in: conversation.messages.map((m) => m._id) }, 
        recipientId: loggedInUserId, 
        read: { $ne: true }
      });

      if (unreadMessages.length > 0) {
        await Message.updateMany(
          { _id: { $in: unreadMessages.map(m => m._id) } },
          { 
            $set: { 
              read: true, 
              status: 'read',
              readAt: new Date()
            } 
          }
        );

        // Emit read receipts to senders
        try {
          const io = req.app.get('io');
          if (io) {
            const readReceipts = unreadMessages.map(msg => ({
              messageId: msg._id,
              readAt: new Date(),
              readBy: loggedInUserId
            }));

            // Group by sender and emit read receipts
            const senderGroups = {};
            unreadMessages.forEach(msg => {
              const senderId = msg.senderId.toString();
              if (!senderGroups[senderId]) {
                senderGroups[senderId] = [];
              }
              senderGroups[senderId].push({
                messageId: msg._id,
                readAt: new Date()
              });
            });

            // Emit to each sender
            Object.keys(senderGroups).forEach(senderId => {
              io.to(`user:${senderId}`).emit('messages:read', senderGroups[senderId]);
            });
          }
        } catch (e) {
          console.error('Failed to emit read receipts:', e.message);
        }
      }

      // Re-fetch with updated read flags
      conversation = await Conversation.findById(conversation._id)
        .populate({ path: 'participants', select: 'name avatar email publicKeyJwk' })
        .populate({
          path: 'messages',
          options: { sort: { createdAt: 1 } },
          populate: [
            { path: 'senderId', select: 'name email avatar' },
            { path: 'recipientId', select: 'name email avatar' }
          ]
        });
    } catch (e) {
      console.error('Failed to mark messages as read:', e.message);
    }

    // Filter out messages soft-deleted by current user before sending
    const convObj = conversation.toObject();
    convObj.messages = (convObj.messages || []).filter((m) => !(m.deletedBy || []).some(id => id?.toString() === loggedInUserId.toString()));

    res.status(200).json(convObj);
  } catch (error) {
    console.error('Error in getConversationWithUser: ', error.message);
    res.status(500).json({ message: 'Server error getting conversation' });
  }
};

// @desc    Get received messages for notifications
// @route   GET /api/messages/received
export const getReceivedMessages = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const messages = await Message.find({ recipientId: loggedInUserId })
          .populate('senderId', 'name avatar email')
          .sort({ createdAt: -1 })
          .limit(10); // Get latest 10 messages for notifications

        res.status(200).json({ messages });
    } catch (error) {
        console.error('Error in getReceivedMessages controller: ', error.message);
        res.status(500).json({ message: 'Server error getting received messages' });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Find the message
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if the user is authorized to delete this message
        // User can delete if they are either the sender or recipient
        if (message.senderId.toString() !== userId && message.recipientId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        // Soft-delete for current user only
        await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedBy: userId } });

        res.status(200).json({ message: 'Message hidden for current user' });
    } catch (error) {
        console.error('Error in deleteMessage controller: ', error.message);
        res.status(500).json({ message: 'Server error deleting message' });
    }
};


// @desc    Clear a conversation (user-specific, not global)
// @route   DELETE /api/messages/conversation/:conversationId
export const clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if the user is a participant
    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to clear this conversation' });
    }

    // Soft-delete all messages for this user only (not global deletion)
    await Message.updateMany(
      { _id: { $in: conversation.messages } },
      { $addToSet: { deletedBy: userId } }
    );

    // Only notify the current user that their conversation was cleared
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('conversation:cleared', { conversationId });
    }

    res.status(200).json({ message: 'Conversation cleared for your account only' });
  } catch (error) {
    console.error('Error in clearConversation controller: ', error.message);
    res.status(500).json({ message: 'Server error clearing conversation' });
  }
};