import User from '../models/User.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js'; // Ensure Notification model is imported

// @desc    Get user profile
// @route   GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Get user's books
// @route   GET /api/users/:userId/books
export const getUserBooks = async (req, res) => {
  try {
    const books = await Book.find({ owner: req.params.userId });
    res.json(books);
  } catch (error) {
    console.error("Get user's books error:", error);
    res.status(500).json({ message: "Server error getting user's books" });
  }
};

// @desc    Search for users
// @route   GET /api/users/search
export const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i'
          }
        }
      : {};
    
    const users = await User.find({ 
      ...keyword,
      _id: { $ne: req.user.id } // Exclude current user from search results
    }).select('name email avatar _id');
    
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

// @desc    Update user location
// @route   PUT /api/users/location
export const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      user.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
      await user.save();
      res.json({ message: 'Location updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
};

// @desc    Get user location
// @route   GET /api/users/:id/location
export const getUserLocation = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.location) {
      res.json(user.location);
    } else {
      res.status(404).json({ message: 'User or location not found' });
    }
  } catch (error) {
    console.error('Get user location error:', error);
    res.status(500).json({ message: 'Server error getting user location' });
  }
};

// @desc    Get all users with their books
// @route   GET /api/users/with-books
export const getUsersWithBooks = async (req, res) => {
  try {
    const { maxDistance, minRating } = req.query;
    let query = {};
    
    if (req.user && req.user.location && maxDistance) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: req.user.location.coordinates
          },
          $maxDistance: parseInt(maxDistance) * 1000
        }
      };
    }
    
    if (minRating) {
      query['rating.overallRating'] = { $gte: parseFloat(minRating) };
    }
    
    const users = await User.find(query)
      .select('name email avatar location booksOwned rating');
    
    const usersWithBooks = await Promise.all(users.map(async (user) => {
      const books = await Book.find({ owner: user._id })
        .select('title author category isAvailable forBorrowing coverImage');
      
      const userObj = user.toObject();
      userObj.booksOwned = books;
      return userObj;
    }));
    
    res.json({ users: usersWithBooks });
  } catch (error) {
    console.error('Get users with books error:', error);
    res.status(500).json({ message: 'Server error getting users with books' });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:userId/profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('name email avatar location booksOwned publicKeyJwk')
      .populate({
        path: 'booksOwned',
        select: '_id title author coverImage isAvailable forBorrowing'
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const books = await Book.find({ owner: userId })
      .select('_id title author coverImage isAvailable forBorrowing');
    
    user.booksOwned = books;
    
    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error getting user profile' });
  }
};

// @desc    Upload/update user public E2EE key
// @route   PUT /api/users/public-key
export const updatePublicKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.publicKeyJwk = req.body.publicKeyJwk || null;
    await user.save();
    res.json({ message: 'Public key updated' });
  } catch (error) {
    console.error('Update public key error:', error);
    res.status(500).json({ message: 'Server error updating public key' });
  }
};

// @desc    Get count of specific unread notifications
// @route   GET /api/users/notifications/unread-count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // ✨ Define the specific notification types that should trigger the visual dot.
    // Ensure these type names match what you save in your Notification documents.
    const relevantNotificationTypes = [
      'new_message', 
      'user_report', 
      'security_alert', 
      'profile_update',
      'borrow_request' // Also include borrow requests as per previous logic
    ];

    // Count only the unread notifications that match the specified types.
    const count = await Notification.countDocuments({
      user: userId,
      read: false,
      type: { $in: relevantNotificationTypes }
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error fetching notification count:', err);
    res.status(500).json({ message: 'Error fetching notification count' });
  }
};

// @desc    Mark relevant notifications as read for the logged-in user
// @route   PUT /api/users/notifications/mark-read
export const markRelevantNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const relevantNotificationTypes = [
      'new_message',
      'user_report',
      'security_alert',
      'profile_update',
      'borrow_request'
    ];
    const result = await Notification.updateMany(
      { user: userId, read: false, type: { $in: relevantNotificationTypes } },
      { $set: { read: true } }
    );
    res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
};

// @desc    Migrate user ratings to new structure (admin only)
// @route   POST /api/users/migrate-ratings
export const migrateUserRatings = async (req, res) => {
  try {
    // Find all users with old rating structure
    const users = await User.find({});
    let migratedCount = 0;

    for (const user of users) {
      // Check if user already has new rating structure
      if (user.rating && typeof user.rating.overallRating !== 'undefined') {
        continue; // Skip users who already have new structure
      }

      // Get the old rating value
      const oldRatingValue = user.rating?.value || 0;
      const oldRatingCount = user.rating?.count || 0;

      // Update to new rating structure
      const newRating = {
        overallRating: oldRatingValue,
        totalRatings: oldRatingCount,
        breakdown: {
          communication: oldRatingValue,
          bookCondition: oldRatingValue,
          timeliness: oldRatingValue
        },
        trustLevel: getTrustLevel(oldRatingValue, oldRatingCount),
        badges: [],
        lastUpdated: new Date()
      };

      await User.findByIdAndUpdate(user._id, { rating: newRating });
      migratedCount++;
    }

    res.json({ 
      message: `Migration completed! Migrated ${migratedCount} users.`,
      migratedCount 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Server error during migration' });
  }
};

// Helper function for migration
function getTrustLevel(rating, count) {
  if (count === 0) return 'new';
  if (rating >= 4.8 && count >= 10) return 'excellent';
  if (rating >= 4.5 && count >= 5) return 'very_good';
  if (rating >= 4.0 && count >= 3) return 'good';
  if (rating >= 3.5) return 'fair';
  return 'needs_improvement';
}