import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory (parent of scripts)
dotenv.config({ path: join(__dirname, '..', '.env') });

const migrateOrganizers = async () => {
  try {
    // Check if MONGO_URI is loaded
    if (!process.env.MONGO_URI) {
      console.error('❌ Error: MONGO_URI not found in .env file');
      console.error('Please make sure .env file exists in bookhive/server directory');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users with role 'organizer'
    const organizers = await User.find({ role: 'organizer' });
    console.log(`Found ${organizers.length} organizer(s) to migrate`);

    if (organizers.length === 0) {
      console.log('No organizers found to migrate');
      process.exit(0);
    }

    // Update each organizer
    for (const organizer of organizers) {
      console.log(`\nMigrating user: ${organizer.name} (${organizer.email})`);
      console.log(`  Current role: ${organizer.role}`);
      
      // Change role back to 'user' and set isOrganizer flag
      organizer.role = 'user';
      organizer.isOrganizer = true;
      
      await organizer.save();
      
      console.log(`  ✓ Updated to: role='user', isOrganizer=true`);
    }

    console.log(`\n✅ Successfully migrated ${organizers.length} organizer(s)`);
    console.log('All organizers now have:');
    console.log('  - role: "user" (keeps all normal user features)');
    console.log('  - isOrganizer: true (adds organizer capabilities)');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateOrganizers();
