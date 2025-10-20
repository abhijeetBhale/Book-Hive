import mongoose from 'mongoose';
import User from '../models/User.js';
import Book from '../models/Book.js';
import 'dotenv/config';

const cleanupDemoUsers = async () => {
  try {
    console.log('🧹 Starting demo user cleanup process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all demo users (identified by @gmail.com email with numbers)
    const demoUsers = await User.find({ email: { $regex: /\d+@gmail\.com$/ } });
    
    if (demoUsers.length === 0) {
      console.log('ℹ️  No demo users found to cleanup.');
      process.exit(0);
    }

    console.log(`📊 Found ${demoUsers.length} demo users to remove`);

    // Get demo user IDs
    const demoUserIds = demoUsers.map(user => user._id);

    // Remove books owned by demo users
    const deletedBooks = await Book.deleteMany({ owner: { $in: demoUserIds } });
    console.log(`📚 Removed ${deletedBooks.deletedCount} demo books`);

    // Remove demo users
    const deletedUsers = await User.deleteMany({ email: { $regex: /\d+@gmail\.com$/ } });
    console.log(`👥 Removed ${deletedUsers.deletedCount} demo users`);

    console.log('\n✅ Demo user cleanup completed successfully!');
    console.log('🎯 Your database is now clean of demo data.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

// Run the cleanup
cleanupDemoUsers();