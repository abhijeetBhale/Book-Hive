import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BorrowRequest from '../models/BorrowRequest.js';

dotenv.config();

const migrateReminderFields = async () => {
  try {
    console.log('🔄 Starting reminder fields migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all borrow requests that don't have the new fields
    const requests = await BorrowRequest.find({
      $or: [
        { remindersSent: { $exists: false } },
        { lastReminderDate: { $exists: false } },
        { reminderHistory: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${requests.length} borrow requests to update`);

    let updated = 0;
    for (const request of requests) {
      // Add default values for new fields
      if (request.remindersSent === undefined) {
        request.remindersSent = 0;
      }
      if (!request.reminderHistory) {
        request.reminderHistory = [];
      }
      
      await request.save();
      updated++;
    }

    console.log(`✅ Migration completed! Updated ${updated} borrow requests`);
    console.log('📧 Email reminder system is now ready to use');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateReminderFields();
