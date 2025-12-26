import User from '../models/User.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';

class WishlistNotificationService {
  // Check for wishlist notifications when a book becomes available
  static async checkWishlistNotifications(bookId) {
    try {
      const book = await Book.findById(bookId).populate('owner', 'name');
      if (!book || !book.isAvailable) {
        return;
      }

      // Find users who have this book in their wishlist
      const usersWithWishlist = await User.find({
        wishlist: bookId,
        _id: { $ne: book.owner._id } // Don't notify the owner
      }).select('_id name email');

      if (usersWithWishlist.length === 0) {
        return;
      }

      // Create notifications for each user
      const notifications = usersWithWishlist.map(user => ({
        userId: user._id,
        type: 'wishlist_available',
        title: 'Wishlist Book Available!',
        message: `"${book.title}" by ${book.author} is now available for borrowing from ${book.owner.name}`,
        metadata: {
          bookId: book._id,
          bookTitle: book.title,
          bookAuthor: book.author,
          ownerName: book.owner.name,
          link: `/books/${book._id}`
        },
        isRead: false,
        createdAt: new Date()
      }));

      await Notification.insertMany(notifications);

      console.log(`Created ${notifications.length} wishlist notifications for book: ${book.title}`);
      
      return notifications.length;
    } catch (error) {
      console.error('Error checking wishlist notifications:', error);
      return 0;
    }
  }

  // Check for new books that match user preferences
  static async checkPreferenceNotifications(bookId) {
    try {
      const book = await Book.findById(bookId).populate('owner', 'name');
      if (!book || !book.isAvailable || !book.forBorrowing) {
        return;
      }

      // Find users with matching preferences
      const matchingUsers = await User.find({
        _id: { $ne: book.owner._id },
        $or: [
          { 'readingPreferences.favoriteGenres': { $in: book.genre || [] } },
          { 'readingPreferences.favoriteAuthors': { $in: [book.author] } }
        ]
      }).select('_id name readingPreferences');

      if (matchingUsers.length === 0) {
        return;
      }

      // Create notifications for matching users
      const notifications = matchingUsers.map(user => {
        const matchReason = [];
        if (user.readingPreferences.favoriteGenres?.some(genre => book.genre?.includes(genre))) {
          matchReason.push('favorite genre');
        }
        if (user.readingPreferences.favoriteAuthors?.includes(book.author)) {
          matchReason.push('favorite author');
        }

        return {
          userId: user._id,
          type: 'book_recommendation',
          title: 'New Book Matches Your Preferences!',
          message: `"${book.title}" by ${book.author} matches your ${matchReason.join(' and ')} preferences`,
          metadata: {
            bookId: book._id,
            bookTitle: book.title,
            bookAuthor: book.author,
            ownerName: book.owner.name,
            matchReason: matchReason.join(', '),
            link: `/books/${book._id}`
          },
          isRead: false,
          createdAt: new Date()
        };
      });

      await Notification.insertMany(notifications);

      console.log(`Created ${notifications.length} preference notifications for book: ${book.title}`);
      
      return notifications.length;
    } catch (error) {
      console.error('Error checking preference notifications:', error);
      return 0;
    }
  }

  // Notify users when a book from their recently viewed becomes available
  static async checkRecentlyViewedNotifications(bookId) {
    try {
      const book = await Book.findById(bookId).populate('owner', 'name');
      if (!book || !book.isAvailable) {
        return;
      }

      // Find users who recently viewed this book
      const usersWithRecentViews = await User.find({
        'recentlyViewed.book': bookId,
        _id: { $ne: book.owner._id }
      }).select('_id name');

      if (usersWithRecentViews.length === 0) {
        return;
      }

      // Create notifications
      const notifications = usersWithRecentViews.map(user => ({
        userId: user._id,
        type: 'recently_viewed_available',
        title: 'Book You Viewed is Available!',
        message: `"${book.title}" that you recently viewed is now available for borrowing`,
        metadata: {
          bookId: book._id,
          bookTitle: book.title,
          bookAuthor: book.author,
          ownerName: book.owner.name,
          link: `/books/${book._id}`
        },
        isRead: false,
        createdAt: new Date()
      }));

      await Notification.insertMany(notifications);

      console.log(`Created ${notifications.length} recently viewed notifications for book: ${book.title}`);
      
      return notifications.length;
    } catch (error) {
      console.error('Error checking recently viewed notifications:', error);
      return 0;
    }
  }

  // Main function to check all types of notifications
  static async checkAllNotifications(bookId) {
    try {
      const [wishlistCount, preferenceCount, recentViewCount] = await Promise.all([
        this.checkWishlistNotifications(bookId),
        this.checkPreferenceNotifications(bookId),
        this.checkRecentlyViewedNotifications(bookId)
      ]);

      return {
        wishlistNotifications: wishlistCount,
        preferenceNotifications: preferenceCount,
        recentViewNotifications: recentViewCount,
        total: wishlistCount + preferenceCount + recentViewCount
      };
    } catch (error) {
      console.error('Error checking all notifications:', error);
      return {
        wishlistNotifications: 0,
        preferenceNotifications: 0,
        recentViewNotifications: 0,
        total: 0
      };
    }
  }
}

export default WishlistNotificationService;