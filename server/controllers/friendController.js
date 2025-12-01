import Friendship from '../models/Friendship.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const sendFriendRequest = async (req, res) => {
  try {
    console.log('sendFriendRequest called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('sendFriendRequest: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const requesterId = req.user._id; // Fixed: use _id instead of id
    const { userId: recipientId } = req.params;
    
    console.log('Requester ID:', requesterId);
    console.log('Recipient ID:', recipientId);
    
    // Convert to strings for comparison
    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const existing = await Friendship.findOne({ $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId }
    ]});
    
    if (existing) {
      console.log('Existing friendship found:', existing);
      return res.status(409).json({ message: 'Friend request already exists or you are already friends' });
    }

    // Check if recipient user exists
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      console.log('Recipient user not found:', recipientId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if recipient has blocked the requester or vice versa
    const requesterUser = await User.findById(requesterId).select('blockedUsers');
    const requesterBlockedRecipient = (requesterUser?.blockedUsers || []).some(id => id.toString() === recipientId.toString());
    const recipientBlockedRequester = (recipientUser?.blockedUsers || []).some(id => id.toString() === requesterId.toString());

    if (requesterBlockedRecipient || recipientBlockedRequester) {
      console.log('User blocked:', { requesterBlockedRecipient, recipientBlockedRequester });
      return res.status(403).json({ message: 'Cannot send friend request to this user' });
    }

    const friendship = await Friendship.create({ requester: requesterId, recipient: recipientId, status: 'pending' });
    try {
      await Notification.create({ 
        userId: recipientId, 
        type: 'friend_request', 
        title: 'New Friend Request',
        message: 'You have a new friend request', 
        metadata: { 
          fromUserId: requesterId, 
          link: '/friends' 
        } 
      });
      
      // Emit socket event for badge update
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${recipientId}`).emit('friend_request:new', { friendshipId: friendship._id });
      }
    } catch {}
    res.status(201).json(friendship);
  } catch (err) {
    console.error('sendFriendRequest error:', err.message);
    res.status(500).json({ message: 'Server error sending friend request' });
  }
};

export const respondToFriendRequest = async (req, res) => {
  try {
    console.log('respondToFriendRequest called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('respondToFriendRequest: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user._id;
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    console.log('User ID:', userId);
    console.log('Request ID:', requestId);
    console.log('Action:', action);

    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
      console.log('Friendship not found:', requestId);
      return res.status(404).json({ message: 'Request not found' });
    }

    console.log('Friendship found:', {
      id: friendship._id,
      requester: friendship.requester,
      recipient: friendship.recipient,
      status: friendship.status
    });

    // Convert both to strings for comparison
    const recipientId = friendship.recipient.toString();
    const currentUserId = userId.toString();

    console.log('Comparing:', { recipientId, currentUserId, match: recipientId === currentUserId });

    if (recipientId !== currentUserId) {
      console.log('User not authorized - not the recipient');
      return res.status(403).json({ message: 'Not authorized - only the recipient can respond to this request' });
    }

    // Validate action parameter
    if (!action || (action !== 'accept' && action !== 'reject')) {
      console.log('Invalid action:', action);
      return res.status(400).json({ message: 'Invalid action. Must be "accept" or "reject"' });
    }

    if (action === 'accept') {
      console.log('Accepting friend request');
      friendship.status = 'accepted';
      await friendship.save();
      
      // Ensure a conversation exists
      const requesterId = friendship.requester;
      const recipientId = friendship.recipient;
      let conversation = await Conversation.findOne({ participants: { $all: [requesterId, recipientId] } });
      if (!conversation) {
        conversation = await Conversation.create({ participants: [requesterId, recipientId] });
      }
      
      // Add a system message announcing friendship
      const sys = await Message.create({
        senderId: requesterId,
        recipientId: recipientId,
        subject: 'Friendship confirmed',
        message: 'You are now friends. Start chatting!',
        messageType: 'system'
      });
      conversation.messages.push(sys._id);
      await conversation.save();
      
      // Create notification for the requester
      try {
        await Notification.create({
          userId: requesterId,
          type: 'friend_accepted',
          title: 'Friend Request Accepted',
          message: `${req.user.name} accepted your friend request`,
          metadata: {
            fromUserId: userId,
            link: '/friends'
          }
        });
        
        // Emit socket event for badge update
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${requesterId}`).emit('friend_request:updated');
          io.to(`user:${userId}`).emit('friend_request:updated');
        }
      } catch (notifError) {
        console.error('Failed to create friend accepted notification:', notifError);
      }
      
      return res.json(friendship);
    }
    
    if (action === 'reject') {
      console.log('Rejecting friend request');
      await friendship.deleteOne();
      
      // Emit socket event for badge update
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${friendship.requester}`).emit('friend_request:updated');
        io.to(`user:${userId}`).emit('friend_request:updated');
      }
      
      return res.json({ message: 'Request rejected' });
    }
  } catch (err) {
    console.error('respondToFriendRequest error:', err.message);
    res.status(500).json({ message: 'Server error responding to request' });
  }
};

export const getFriendsAndRequests = async (req, res) => {
  try {
    console.log('getFriendsAndRequests called for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.error('getFriendsAndRequests: req.user or req.user._id is undefined');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const userId = req.user._id; // Fixed: use _id instead of id
    const pending = await Friendship.find({ recipient: userId, status: 'pending' }).populate('requester', 'name avatar email isVerified');
    const sent = await Friendship.find({ requester: userId, status: 'pending' }).populate('recipient', 'name avatar email isVerified');
    const accepted = await Friendship.find({ $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]}).populate('requester recipient', 'name avatar email isVerified');

    res.json({ pending, sent, friends: accepted });
  } catch (err) {
    console.error('getFriendsAndRequests error:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Server error fetching friends',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const userId = req.user._id; // Fixed: use _id instead of id
    const { friendshipId } = req.params;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) return res.status(404).json({ message: 'Friendship not found' });

    // Check if user is part of this friendship
    if (friendship.requester.toString() !== userId && friendship.recipient.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await friendship.deleteOne();
    res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error('removeFriend error:', err.message);
    res.status(500).json({ message: 'Server error removing friend' });
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id; // Fixed: use _id instead of id
    const { requestId } = req.params;

    const friendship = await Friendship.findById(requestId);
    if (!friendship) return res.status(404).json({ message: 'Request not found' });

    // Only the requester can cancel their own request
    if (friendship.requester.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await friendship.deleteOne();
    res.json({ message: 'Friend request cancelled' });
  } catch (err) {
    console.error('cancelFriendRequest error:', err.message);
    res.status(500).json({ message: 'Server error cancelling request' });
  }
};


