import 'dotenv/config';
import mongoose from 'mongoose';
import connectDatabase from '../config/database.js';

// Setup script for broadcasts feature
async function setupBroadcasts() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();

    console.log('✅ Database connected');
    console.log('📋 Creating indexes for BookBroadcast collection...');

    // Get the BookBroadcast collection
    const db = mongoose.connection.db;
    const collection = db.collection('bookbroadcasts');

    // Create indexes
    await collection.createIndex({ status: 1, createdAt: -1 });
    await collection.createIndex({ requester: 1 });
    await collection.createIndex({ expiresAt: 1 });

    console.log('✅ Indexes created successfully');
    console.log('');
    console.log('🎉 Broadcasts feature setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your server');
    console.log('2. Navigate to /broadcasts in your app');
    console.log('3. Create your first broadcast!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupBroadcasts();
