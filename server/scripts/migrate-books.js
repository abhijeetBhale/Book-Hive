import mongoose from 'mongoose';
import User from '../models/User.js';
import Book from '../models/Book.js';
import 'dotenv/config';

const migrateBooks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB for migration');

    // Get all books
    const books = await Book.find({});
    console.log(`Found ${books.length} books to process`);

    // Reset all users' booksOwned arrays first
    await User.updateMany({}, { $set: { booksOwned: [] } });
    console.log('Reset all users booksOwned arrays');

    // Group books by owner
    const booksByOwner = books.reduce((acc, book) => {
      if (!acc[book.owner]) {
        acc[book.owner] = [];
      }
      acc[book.owner].push(book._id);
      return acc;
    }, {});

    // Update each user's booksOwned array
    for (const [userId, bookIds] of Object.entries(booksByOwner)) {
      await User.findByIdAndUpdate(
        userId,
        { $set: { booksOwned: bookIds } },
        { new: true }
      );
      console.log(`Updated user ${userId} with ${bookIds.length} books`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateBooks();
