import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

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

    // Emit realtime event to sender and recipient rooms
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          conversationId: conversation._id.toString(),
          messageId: newMessage._id.toString(),
          from: senderId,
          recipientId,
          createdAt: newMessage.createdAt,
          subject: newMessage.subject,
          message: newMessage.message,
          ciphertext: newMessage.ciphertext,
          iv: newMessage.iv,
          salt: newMessage.salt,
          alg: newMessage.alg,
        };
        io.to(`user:${recipientId}`).emit('message:new', payload);
        io.to(`user:${senderId}`).emit('message:new', payload);
      }
    } catch (e) {
      console.error('Failed to emit message:new event:', e.message);
    }

    // Fire a notification for the recipient
    try {
      await Notification.create({
        user: recipientId,
        type: 'new_message',
        message: `${req.user.name} sent you a message${subject ? `: ${subject}` : ''}`,
        fromUser: senderId,
        link: `/messages`
      });
    } catch (e) {
      console.error('Failed to create new_message notification:', e.message);
    }

    res.status(201).json(newMessage);
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

        // Attach unread counts (treat missing read as unread for legacy docs)
        const withCounts = conversations.map((c) => {
          const obj = c.toObject();
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
      await Message.updateMany(
        { _id: { $in: conversation.messages.map((m) => m._id) }, recipientId: loggedInUserId, read: { $ne: true } },
        { $set: { read: true } }
      );
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

    res.status(200).json(conversation);
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

        // Remove message from conversation
        await Conversation.updateMany(
            { messages: messageId },
            { $pull: { messages: messageId } }
        );

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMessage controller: ', error.message);
        res.status(500).json({ message: 'Server error deleting message' });
    }
};
