import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// ... (keep all the existing controller functions like sendMessage, getConversations, etc.)

// @desc    Send a message to a user
// @route   POST /api/messages/send/:recipientId
export const sendMessage = async (req, res) => {
  try {
    console.log('sendMessage called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('sendMessage: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Now correctly receiving both subject and message
    const { subject, ciphertext, iv, salt, alg, message } = req.body;
    const { recipientId } = req.params;
    const senderId = req.user._id;

    // Check if either user has blocked the other
    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('blockedUsers').lean(),
      User.findById(recipientId).select('blockedUsers').lean()
    ]);

    const senderBlockedRecipient = (sender?.blockedUsers || []).some(id => id.toString() === recipientId);
    const recipientBlockedSender = (recipient?.blockedUsers || []).some(id => id.toString() === senderId);

    if (senderBlockedRecipient || recipientBlockedSender) {
      return res.status(403).json({ message: 'Cannot send message to this user' });
    }

    // Create message immediately without waiting for conversation
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

    // Save message first for faster response
    await newMessage.save();

    // Populate user data for response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email avatar')
      .populate('recipientId', 'name email avatar')
      .lean();

    // Send response immediately
    res.status(201).json(populatedMessage);

    // Handle conversation and socket events asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        // Update or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, recipientId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, recipientId],
          });
        }

        conversation.messages.push(newMessage._id);
        await conversation.save();

        // Emit realtime events
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
        console.error('Failed to handle post-message operations:', e.message);
      }
    });

  } catch (error) {
    console.error('Error in sendMessage controller: ', error.message);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// @desc    Get all conversations for the logged-in user (OPTIMIZED)
// @route   GET /api/messages/conversations
export const getConversations = async (req, res) => {
    try {
        console.log('getConversations called for user:', req.user?._id);
        
        if (!req.user || !req.user._id) {
          console.error('getConversations: req.user or req.user._id is undefined');
          return res.status(401).json({ 
            success: false,
            message: 'User not authenticated' 
          });
        }

        const loggedInUserId = req.user._id;
        const { limit = 20 } = req.query;
        
        // Simple approach: Find conversations and populate
        const conversations = await Conversation.find({ 
          participants: loggedInUserId 
        })
        .populate('participants', 'name avatar email publicKeyJwk blockedUsers')
        .populate({
          path: 'messages',
          options: { sort: { createdAt: -1 }, limit: 50 },
          populate: [
            { path: 'senderId', select: 'name email avatar' },
            { path: 'recipientId', select: 'name email avatar' }
          ]
        })
        .limit(parseInt(limit))
        .sort({ updatedAt: -1 })
        .lean();

        // Get current user's blocked list
        const currentUser = await User.findById(loggedInUserId).select('blockedUsers').lean();
        const blockedUserIds = new Set((currentUser?.blockedUsers || []).map(id => id.toString()));
        
        // Process conversations
        const processedConversations = conversations
          .filter((conv) => {
            // Filter out blocked users
            const otherParticipant = conv.participants.find(p => p._id.toString() !== loggedInUserId.toString());
            if (!otherParticipant) return false;
            
            const otherUserId = otherParticipant._id.toString();
            const isBlocked = blockedUserIds.has(otherUserId);
            const hasBlockedMe = otherParticipant.blockedUsers?.some(id => id.toString() === loggedInUserId.toString());
            
            return !isBlocked && !hasBlockedMe;
          })
          .map((conv) => {
            // Get last message
            const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
            
            // Calculate unread count
            const unreadCount = conv.messages ? conv.messages.filter(msg => 
              msg.recipientId && msg.recipientId._id && 
              msg.recipientId._id.toString() === loggedInUserId.toString() && 
              !msg.read
            ).length : 0;
            
            return {
              _id: conv._id,
              participants: conv.participants,
              messages: conv.messages,
              lastMessage,
              unreadCount,
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt
            };
          })
          .sort((a, b) => {
            // Sort by last message date
            const aDate = a.lastMessage?.createdAt || a.updatedAt;
            const bDate = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(bDate) - new Date(aDate);
          });

        res.status(200).json(processedConversations);
    } catch (error) {
        console.error('Error in getConversations controller:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
          success: false,
          message: 'Server error getting conversations',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get conversation with a specific user (and messages with populated emails)
// @route   GET /api/messages/with/:userId
export const getConversationWithUser = async (req, res) => {
  try {
    console.log('getConversationWithUser called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('getConversationWithUser: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const loggedInUserId = req.user._id;
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
        console.log('getReceivedMessages called for user:', req.user?._id);
        
        if (!req.user || !req.user._id) {
          console.error('getReceivedMessages: req.user or req.user._id is undefined');
          return res.status(401).json({ 
            success: false,
            message: 'User not authenticated' 
          });
        }

        const loggedInUserId = req.user._id;
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
        console.log('deleteMessage called for user:', req.user?._id);
        
        if (!req.user || !req.user._id) {
          console.error('deleteMessage: req.user or req.user._id is undefined');
          return res.status(401).json({ 
            success: false,
            message: 'User not authenticated' 
          });
        }

        const { messageId } = req.params;
        const userId = req.user._id;

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


// @desc    Send a file message to a user
// @route   POST /api/messages/send-file/:recipientId
export const sendFileMessage = async (req, res) => {
  try {
    console.log('sendFileMessage called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('sendFileMessage: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { recipientId } = req.params;
    const senderId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'bookhive/messages',
      resource_type: 'auto', // Automatically detect file type
      public_id: `${Date.now()}-${req.file.originalname}`,
    });

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
      subject: 'File',
      message: `Shared a file: ${req.file.originalname}`,
      messageType: 'file',
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
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
      console.error('Failed to emit file message event:', e.message);
    }

    res.status(201).json({
      ...populatedMessage,
      fileUrl: result.secure_url
    });
  } catch (error) {
    console.error('Error in sendFileMessage controller: ', error.message);
    res.status(500).json({ message: 'Server error sending file message' });
  }
};

// @desc    Clear a conversation (user-specific, not global)
// @route   DELETE /api/messages/conversation/:conversationId
export const clearConversation = async (req, res) => {
  try {
    console.log('clearConversation called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('clearConversation: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { conversationId } = req.params;
    const userId = req.user._id;

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

// @desc    Block a user
// @route   POST /api/messages/block/:userId
export const blockUser = async (req, res) => {
  try {
    console.log('blockUser called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('blockUser: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    // Check if user exists
    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to blocked users list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userId }
    });

    // Emit socket event to notify both users
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${currentUserId}`).emit('user:blocked', { userId });
      io.to(`user:${userId}`).emit('user:blocked_by', { userId: currentUserId });
    }

    res.status(200).json({ message: 'User blocked successfully', blockedUserId: userId });
  } catch (error) {
    console.error('Error in blockUser controller: ', error.message);
    res.status(500).json({ message: 'Server error blocking user' });
  }
};

// @desc    Unblock a user
// @route   POST /api/messages/unblock/:userId
export const unblockUser = async (req, res) => {
  try {
    console.log('unblockUser called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('unblockUser: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Remove from blocked users list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userId }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${currentUserId}`).emit('user:unblocked', { userId });
    }

    res.status(200).json({ message: 'User unblocked successfully', unblockedUserId: userId });
  } catch (error) {
    console.error('Error in unblockUser controller: ', error.message);
    res.status(500).json({ message: 'Server error unblocking user' });
  }
};

// @desc    Get list of blocked users
// @route   GET /api/messages/blocked
export const getBlockedUsers = async (req, res) => {
  try {
    console.log('getBlockedUsers called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('getBlockedUsers: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId)
      .populate('blockedUsers', 'name email avatar')
      .lean();

    res.status(200).json({ blockedUsers: user?.blockedUsers || [] });
  } catch (error) {
    console.error('Error in getBlockedUsers controller: ', error.message);
    res.status(500).json({ message: 'Server error getting blocked users' });
  }
};



