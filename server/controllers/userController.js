import User from '../models/User.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js'; // Ensure Notification model is imported
import UserStats from '../models/UserStats.js';
import Friendship from '../models/Friendship.js';
import { validateUsername } from '../utils/validation.js';

// @desc    Get user profile
// @route   GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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
    const user = await User.findById(req.user._id);
    if (user) {
      // Validate username if it's being changed
      if (req.body.name && req.body.name !== user.name) {
        const usernameError = validateUsername(req.body.name);
        if (usernameError) {
          return res.status(400).json({ message: usernameError });
        }
      }
      
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
    const searchTerm = req.query.keyword;
    
    let searchQuery = {};
    
    if (searchTerm) {
      // Search in both name and email fields
      searchQuery = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find({ 
      ...searchQuery,
      _id: { $ne: req.user._id }, // Exclude current user from search results (fixed: use _id instead of id)
      isActive: { $ne: false } // Only show active users
    }).select('name email avatar _id isActive')
      .limit(20) // Limit results for performance
      .sort({ name: 1 }); // Sort by name alphabetically
    
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
    const user = await User.findById(req.user._id);

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

// @desc    Get all users with their books (OPTIMIZED)
// @route   GET /api/users/with-books
export const getUsersWithBooks = async (req, res) => {
  try {
    const { maxDistance, minRating, page = 1, limit = 50 } = req.query;
    let query = { isActive: { $ne: false } }; // Only active users
    
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
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // OPTIMIZATION: Use aggregation pipeline for better performance
    let usersWithBooks;
    try {
      usersWithBooks = await User.aggregate([
        { $match: query },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: 'owner',
            as: 'booksOwned',
            pipeline: [
              { $project: { title: 1, author: 1, category: 1, isAvailable: 1, forBorrowing: 1, coverImage: 1 } },
              { $limit: 10 } // Limit books per user for performance
            ]
          }
        },
        {
          $lookup: {
            from: 'userstats',
            localField: '_id',
            foreignField: 'user',
            as: 'stats'
          }
        },
        {
          $lookup: {
            from: 'friendships',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$status', 'accepted'] },
                      {
                        $or: [
                          { $eq: ['$requester', '$$userId'] },
                          { $eq: ['$recipient', '$$userId'] }
                        ]
                      }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'friendsCount'
          }
        },
        {
          $addFields: {
            friendsCount: { $ifNull: [{ $arrayElemAt: ['$friendsCount.count', 0] }, 0] },
            contributions: {
              $add: [
                { $ifNull: [{ $arrayElemAt: ['$stats.sharing.booksLent', 0] }, 0] },
                { $ifNull: [{ $arrayElemAt: ['$stats.sharing.booksBorrowed', 0] }, 0] }
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            location: 1,
            rating: 1,
            createdAt: 1,
            isOrganizer: 1,
            isVerified: 1,
            booksOwned: 1,
            friendsCount: 1,
            contributions: 1
          }
        }
      ]);
      
      console.log(`getUsersWithBooks: Found ${usersWithBooks.length} users`);
    } catch (aggError) {
      console.error('Aggregation error:', aggError);
      // Fallback to simple query if aggregation fails
      const users = await User.find(query)
        .select('name email avatar location rating createdAt isOrganizer')
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      usersWithBooks = users.map(user => ({
        ...user,
        booksOwned: [],
        friendsCount: 0,
        contributions: 0
      }));
    }
    
    // Apply location privacy
    usersWithBooks.forEach(user => {
      if (user.location && user.location.displayCoordinates && user.location.displayCoordinates.length === 2) {
        user.location.coordinates = user.location.displayCoordinates;
        delete user.location.displayCoordinates;
      }
    });
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.json({ 
      users: usersWithBooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
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
      .select('name email avatar location booksOwned publicKeyJwk rating isOrganizer isVerified')
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
    
    // Apply location privacy - return display coordinates for map
    const userObj = user.toObject();
    if (userObj.location && userObj.location.displayCoordinates && userObj.location.displayCoordinates.length === 2) {
      userObj.location.coordinates = userObj.location.displayCoordinates;
      delete userObj.location.displayCoordinates; // Don't expose both sets of coordinates
    }
    
    res.json({ user: userObj });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error getting user profile' });
  }
};

// @desc    Upload/update user public E2EE key
// @route   PUT /api/users/public-key
export const updatePublicKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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
