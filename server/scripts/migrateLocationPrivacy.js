/**
 * Migration script to add display coordinates for existing users
 * This ensures privacy for users who already have location data
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import { getConsistentPrivacyOffset } from '../utils/locationPrivacy.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const migrateLocationPrivacy = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for migration');

    // Find users with location coordinates but no display coordinates
    const usersToUpdate = await User.find({
      'location.coordinates': { $exists: true, $ne: [0, 0] },
      $or: [
        { 'location.displayCoordinates': { $exists: false } },
        { 'location.displayCoordinates': [0, 0] }
      ]
    });

    console.log(`📍 Found ${usersToUpdate.length} users needing location privacy migration`);

    let updatedCount = 0;

    for (const user of usersToUpdate) {
      if (user.location.coordinates && user.location.coordinates.length === 2) {
        const [longitude, latitude] = user.location.coordinates;
        
        // Skip if coordinates are default [0, 0]
        if (longitude === 0 && latitude === 0) {
          continue;
        }
        
        // Generate consistent privacy offset
        const offsetCoords = getConsistentPrivacyOffset(user._id.toString(), latitude, longitude);
        
        // Update user with display coordinates
        user.location.displayCoordinates = [offsetCoords.longitude, offsetCoords.latitude];
        user.location.lastUpdated = new Date();
        await user.save();
        
        updatedCount++;
        console.log(`✅ Updated privacy coordinates for user: ${user.name || user.email}`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updatedCount} users with privacy coordinates`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run migration
migrateLocationPrivacy();
