import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const addBlockedUsersField = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Adding blockedUsers field to all users...');
    
    const result = await User.updateMany(
      { blockedUsers: { $exists: false } },
      { $set: { blockedUsers: [] } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with blockedUsers field`);
    console.log('✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addBlockedUsersField();
