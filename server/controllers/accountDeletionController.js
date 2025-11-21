import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Friendship from '../models/Friendship.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Report from '../models/Report.js';
import Testimonial from '../models/Testimonial.js';
import UserStats from '../models/UserStats.js';
import UserAchievement from '../models/UserAchievement.js';
import ClubMembership from '../models/ClubMembership.js';
import ClubPost from '../models/ClubPost.js';
import ClubEvent from '../models/ClubEvent.js';
import Challenge from '../models/Challenge.js';
import { sendAccountDeletionEmail } from '../services/emailService.js';

// Get deletion preview - shows what will be deleted
export const getDeletionPreview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count all data associated with the user
    const [
      booksCount,
      friendshipsCount,
      messagesCount,
      reviewsCount,
      borrowRequestsCount,
      activeBorrowsCount,
      clubMembershipsCount,
      notificationsCount,
      reportsCount,
      testimonialsCount,
      userStatsCount,
      achievementsCount,
      clubPostsCount,
      clubEventsCount,
      challengesCount
    ] = await Promise.all([
      Book.countDocuments({ owner: userId }),
      Friendship.countDocuments({ $or: [{ requester: userId }, { recipient: userId }] }),
      Message.countDocuments({ sender: userId }),
      Review.countDocuments({ $or: [{ fromUser: userId }, { toUser: userId }] }),
      BorrowRequest.countDocuments({ $or: [{ borrower: userId }, { owner: userId }] }),
      BorrowRequest.countDocuments({ 
        $or: [{ borrower: userId }, { owner: userId }],
        status: { $in: ['pending', 'approved', 'borrowed'] }
      }),
      ClubMembership.countDocuments({ user: userId }),
      Notification.countDocuments({ userId }),
      Report.countDocuments({ $or: [{ reportedBy: userId }, { reportedUser: userId }] }),
      Testimonial.countDocuments({ user: userId }),
      UserStats.countDocuments({ user: userId }),
      UserAchievement.countDocuments({ user: userId }),
      ClubPost.countDocuments({ author: userId }),
      ClubEvent.countDocuments({ createdBy: userId }),
      Challenge.countDocuments({ 'participants.user': userId })
    ]);

    // Check if user can delete account (no active borrows)
    const canDelete = activeBorrowsCount === 0;
    const warning = canDelete 
      ? null 
      : 'You have active borrow requests. Please complete or cancel them before deleting your account.';

    // Build consequences list
    const consequences = [
      'Your profile and all personal information will be permanently deleted',
      `${booksCount} book(s) will be removed from the platform`,
      `${friendshipsCount} friendship(s) will be removed`,
      `You will be removed from ${clubMembershipsCount} book club(s)`,
      'All your messages will be deleted from conversations',
      'All your reviews and ratings will be removed',
      'Your location will be removed from the map',
      'All notifications related to your account will be deleted',
      'This action cannot be undone'
    ];

    res.json({
      canDelete,
      warning,
      dataToBeDeleted: {
        books: booksCount,
        friendships: friendshipsCount,
        messages: messagesCount,
        reviews: reviewsCount,
        totalBorrowRequests: borrowRequestsCount,
        activeBorrowRequests: activeBorrowsCount,
        clubMemberships: clubMembershipsCount,
        notifications: notificationsCount,
        reports: reportsCount,
        testimonials: testimonialsCount,
        stats: userStatsCount,
        achievements: achievementsCount,
        clubPosts: clubPostsCount,
        clubEvents: clubEventsCount,
        challenges: challengesCount
      },
      consequences
    });
  } catch (error) {
    console.error('Error getting deletion preview:', error);
    res.status(500).json({ message: 'Failed to get deletion preview' });
  }
};

// Delete account permanently
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password, confirmText } = req.body;

    // Verify confirmation text
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ message: 'Invalid confirmation text' });
    }

    // Get user with password for verification
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password for non-OAuth users
    if (!user.googleId) {
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }

    // Check for active borrow requests
    const activeBorrows = await BorrowRequest.countDocuments({
      $or: [{ borrower: userId }, { owner: userId }],
      status: { $in: ['pending', 'approved', 'borrowed'] }
    });

    if (activeBorrows > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active borrow requests. Please complete or cancel them first.' 
      });
    }

    // Store email for sending farewell message
    const userEmail = user.email;
    const userName = user.name;

    // Start deletion process
    await Promise.all([
      // Delete all books owned by user
      Book.deleteMany({ owner: userId }),
      
      // Delete all friendships
      Friendship.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] }),
      
      // Delete all messages sent by user
      Message.deleteMany({ sender: userId }),
      
      // Delete conversations where user is a participant
      Conversation.deleteMany({ participants: userId }),
      
      // Delete all reviews (given and received)
      Review.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
      
      // Delete all borrow requests
      BorrowRequest.deleteMany({ $or: [{ borrower: userId }, { owner: userId }] }),
      
      // Delete all notifications
      Notification.deleteMany({ userId }),
      
      // Delete all reports
      Report.deleteMany({ $or: [{ reportedBy: userId }, { reportedUser: userId }] }),
      
      // Delete testimonials
      Testimonial.deleteMany({ user: userId }),
      
      // Delete user stats
      UserStats.deleteMany({ user: userId }),
      
      // Delete user achievements
      UserAchievement.deleteMany({ user: userId }),
      
      // Delete club memberships
      ClubMembership.deleteMany({ user: userId }),
      
      // Delete club posts
      ClubPost.deleteMany({ author: userId }),
      
      // Delete club events
      ClubEvent.deleteMany({ createdBy: userId }),
      
      // Remove user from challenges
      Challenge.updateMany(
        { 'participants.user': userId },
        { $pull: { participants: { user: userId } } }
      )
    ]);

    // Remove user from other users' conversations (update participants array)
    await Conversation.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    );

    // Delete empty conversations
    await Conversation.deleteMany({ participants: { $size: 0 } });

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    // Send farewell email
    try {
      await sendAccountDeletionEmail(userEmail, userName);
    } catch (emailError) {
      console.error('Error sending farewell email:', emailError);
      // Don't fail the deletion if email fails
    }

    res.json({ 
      message: 'Account deleted successfully',
      email: userEmail
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};
