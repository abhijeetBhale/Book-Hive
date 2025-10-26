import Friendship from '../models/Friendship.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { userId: recipientId } = req.params;
    if (requesterId === recipientId) return res.status(400).json({ message: 'Cannot friend yourself' });

    const existing = await Friendship.findOne({ $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId }
    ]});
    if (existing) return res.status(409).json({ message: 'Friend request already exists' });

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
    } catch {}
    res.status(201).json(friendship);
  } catch (err) {
    console.error('sendFriendRequest error:', err.message);
    res.status(500).json({ message: 'Server error sending friend request' });
  }
};

export const respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    const friendship = await Friendship.findById(requestId);
    if (!friendship) return res.status(404).json({ message: 'Request not found' });
    if (friendship.recipient.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

    if (action === 'accept') {
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
      } catch (notifError) {
        console.error('Failed to create friend accepted notification:', notifError);
      }
      
      return res.json(friendship);
    }
    
    if (action === 'reject') {
      await friendship.deleteOne();
      return res.json({ message: 'Request rejected' });
    }
    
    return res.status(400).json({ message: 'Invalid action' });
  } catch (err) {
    console.error('respondToFriendRequest error:', err.message);
    res.status(500).json({ message: 'Server error responding to request' });
  }
};

export const getFriendsAndRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const pending = await Friendship.find({ recipient: userId, status: 'pending' }).populate('requester', 'name avatar email');
    const sent = await Friendship.find({ requester: userId, status: 'pending' }).populate('recipient', 'name avatar email');
    const accepted = await Friendship.find({ $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]}).populate('requester recipient', 'name avatar email');

    res.json({ pending, sent, friends: accepted });
  } catch (err) {
    console.error('getFriendsAndRequests error:', err.message);
    res.status(500).json({ message: 'Server error fetching friends' });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
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
    const userId = req.user.id;
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


