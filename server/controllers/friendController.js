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
      await Notification.create({ user: recipientId, type: 'friend_request', message: 'You have a new friend request', fromUser: requesterId, link: '/friends' });
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
        type: 'system'
      });
      conversation.messages.push(sys._id);
      await conversation.save();
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


