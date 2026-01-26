import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixLastSeenTimes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process`);

    let updatedCount = 0;
    const now = new Date();

    for (const user of users) {
      let newLastSeen = user.lastSeen;
      
      // If user has a lastActive time, use it as the basis for lastSeen
      if (user.lastActive) {
        // For users who haven't been active recently, set lastSeen to their lastActive time
        // Add some randomization to make it more realistic
        const timeSinceActive = now - user.lastActive;
        const hoursInactive = timeSinceActive / (1000 * 60 * 60);
        
        if (hoursInactive > 1) {
          // For users inactive for more than 1 hour, set lastSeen to lastActive
          // with some small random variation (0-30 minutes after lastActive)
          const randomMinutes = Math.floor(Math.random() * 30);
          newLastSeen = new Date(user.lastActive.getTime() + (randomMinutes * 60 * 1000));
        } else {
          // For recently active users, keep their current lastSeen or set to lastActive
          newLastSeen = user.lastActive;
        }
      } else {
        // If no lastActive, set lastSeen to their creation date plus some random time
        const daysSinceCreation = (now - user.createdAt) / (1000 * 60 * 60 * 24);
        const randomDaysAgo = Math.min(daysSinceCreation, Math.floor(Math.random() * 30) + 1);
        newLastSeen = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000));
      }

      // Update the user if lastSeen has changed
      if (newLastSeen.getTime() !== user.lastSeen?.getTime()) {
        await User.findByIdAndUpdate(user._id, { lastSeen: newLastSeen });
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`📝 Updated ${updatedCount} users...`);
        }
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} users with realistic lastSeen times`);
    
    // Show some examples
    const sampleUsers = await User.find({}).limit(5).select('name lastActive lastSeen createdAt');
    console.log('\n📋 Sample of updated users:');
    sampleUsers.forEach(user => {
      const now = new Date();
      const diffMs = now - user.lastSeen;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let timeAgo;
      if (diffHours < 24) {
        timeAgo = `${diffHours} hours ago`;
      } else {
        timeAgo = `${diffDays} days ago`;
      }
      
      console.log(`  - ${user.name}: Last seen ${timeAgo}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

fixLastSeenTimes();