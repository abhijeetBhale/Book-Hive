import 'dotenv/config';
import mongoose from 'mongoose';
import redisClient from '../config/redis.js';
import cacheService from '../services/cacheService.js';

// Import models (adjust paths as needed)
import Book from '../models/Book.js';
import User from '../models/User.js';

async function warmCache() {
  console.log('🔥 Starting cache warming process...');
  console.log('=' .repeat(50));

  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Connect to Redis
    console.log('🔄 Connecting to Redis...');
    const client = await redisClient.connect();
    if (!client) {
      throw new Error('Failed to connect to Redis');
    }
    console.log('✅ Redis connected');

    // 1. Cache popular books
    console.log('\n1️⃣  Caching popular books...');
    try {
      // Get popular books (most borrowed/viewed)
      const popularBooks = await Book.find({ isAvailable: true })
        .sort({ borrowCount: -1, viewCount: -1 })
        .limit(20)
        .lean();
      
      if (popularBooks.length > 0) {
        await cacheService.setPopularBooks(popularBooks, 'all');
        console.log(`✅ Cached ${popularBooks.length} popular books`);
      }

      // Cache by categories
      const categories = ['fiction', 'non-fiction', 'science', 'technology', 'history'];
      for (const category of categories) {
        const categoryBooks = await Book.find({ 
          isAvailable: true, 
          category: { $regex: category, $options: 'i' }
        })
        .sort({ borrowCount: -1, viewCount: -1 })
        .limit(10)
        .lean();
        
        if (categoryBooks.length > 0) {
          await cacheService.setPopularBooks(categoryBooks, category);
          console.log(`✅ Cached ${categoryBooks.length} ${category} books`);
        }
      }
    } catch (error) {
      console.error('❌ Error caching popular books:', error.message);
    }

    // 2. Cache community stats
    console.log('\n2️⃣  Caching community stats...');
    try {
      const stats = {
        totalBooks: await Book.countDocuments(),
        availableBooks: await Book.countDocuments({ isAvailable: true }),
        totalUsers: await User.countDocuments(),
        activeUsers: await User.countDocuments({ 
          lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }),
        totalBorrows: await Book.aggregate([
          { $group: { _id: null, total: { $sum: '$borrowCount' } } }
        ]).then(result => result[0]?.total || 0),
        timestamp: new Date().toISOString()
      };

      await cacheService.setCommunityStats(stats);
      console.log('✅ Community stats cached:', stats);
    } catch (error) {
      console.error('❌ Error caching community stats:', error.message);
    }

    // 3. Cache book locations for geospatial queries
    console.log('\n3️⃣  Caching book locations...');
    try {
      const booksWithLocation = await Book.find({
        isAvailable: true,
        'location.coordinates': { $exists: true, $ne: [] }
      }).select('_id location').lean();

      let locationsCached = 0;
      for (const book of booksWithLocation) {
        if (book.location && book.location.coordinates && book.location.coordinates.length === 2) {
          const [longitude, latitude] = book.location.coordinates;
          await cacheService.addBookLocation(book._id.toString(), longitude, latitude);
          locationsCached++;
        }
      }
      
      console.log(`✅ Cached ${locationsCached} book locations`);
    } catch (error) {
      console.error('❌ Error caching book locations:', error.message);
    }

    // 4. Pre-cache common search queries
    console.log('\n4️⃣  Pre-caching common searches...');
    try {
      const commonQueries = [
        'javascript',
        'python',
        'react',
        'node.js',
        'programming',
        'web development',
        'data science',
        'machine learning'
      ];

      for (const query of commonQueries) {
        const searchResults = await Book.find({
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { author: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ],
          isAvailable: true
        }).limit(10).lean();

        if (searchResults.length > 0) {
          await cacheService.setSearchResults(query, {}, searchResults);
          console.log(`✅ Cached search results for "${query}": ${searchResults.length} books`);
        }
      }
    } catch (error) {
      console.error('❌ Error pre-caching searches:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Cache warming completed successfully!');
    console.log('✅ Your Redis cache is now warmed with popular data');

  } catch (error) {
    console.error('\n❌ Cache warming failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Cleanup connections
    try {
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected');
      
      await redisClient.disconnect();
      console.log('🔌 Redis disconnected');
    } catch (disconnectError) {
      console.error('❌ Error during cleanup:', disconnectError.message);
    }
  }
}

// Run cache warming
warmCache();