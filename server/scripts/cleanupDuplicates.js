import dotenv from 'dotenv';
import mongoose from 'mongoose';
import BorrowRequest from '../models/BorrowRequest.js';

dotenv.config();

const cleanupDuplicates = async () => {
  try {
    console.log('🧹 Cleaning up duplicate borrow requests...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find potential duplicates (same book, borrower, owner, status)
    const duplicates = await BorrowRequest.aggregate([
      {
        $group: {
          _id: {
            book: '$book',
            borrower: '$borrower',
            owner: '$owner',
            status: '$status'
          },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`📊 Found ${duplicates.length} groups of duplicates\n`);

    let totalRemoved = 0;
    for (const duplicate of duplicates) {
      // Keep the first one, remove the rest
      const toRemove = duplicate.docs.slice(1);
      
      console.log(`Removing ${toRemove.length} duplicate(s) for group:`, duplicate._id);
      
      await BorrowRequest.deleteMany({
        _id: { $in: toRemove }
      });
      
      totalRemoved += toRemove.length;
    }

    console.log(`\n✅ Cleanup completed! Removed ${totalRemoved} duplicate records`);
    console.log('📧 Email system is now ready for clean production deployment\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
};

// Uncomment the line below to run cleanup
// cleanupDuplicates();

console.log('⚠️  Duplicate cleanup script created but not executed.');
console.log('📝 To run cleanup, uncomment the last line in this file and run:');
console.log('   node scripts/cleanupDuplicates.js');
console.log('\n💡 This is optional - the system works fine with duplicates too!');