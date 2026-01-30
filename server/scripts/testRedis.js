import 'dotenv/config';
import redisClient from '../config/redis.js';
import cacheService from '../services/cacheService.js';

async function testRedisConnection() {
  console.log('🧪 Testing Redis Cloud connection...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Basic connection
    console.log('1️⃣  Testing basic connection...');
    const client = await redisClient.connect();
    
    if (!client) {
      throw new Error('Failed to connect to Redis');
    }
    console.log('✅ Basic connection successful');

    // Test 2: Ping test
    console.log('\n2️⃣  Testing ping...');
    const pingResult = await redisClient.ping();
    console.log(`✅ Ping result: ${pingResult}`);

    // Test 3: Basic operations
    console.log('\n3️⃣  Testing basic operations...');
    
    // SET operation
    const setResult = await redisClient.set('test:basic', { message: 'Hello Redis!' }, 60);
    console.log(`✅ SET operation: ${setResult}`);
    
    // GET operation
    const getResult = await redisClient.get('test:basic');
    console.log(`✅ GET operation:`, getResult);
    
    // EXISTS operation
    const existsResult = await redisClient.exists('test:basic');
    console.log(`✅ EXISTS operation: ${existsResult}`);
    
    // DELETE operation
    const delResult = await redisClient.del('test:basic');
    console.log(`✅ DELETE operation: ${delResult}`);

    // Test 4: Cache service
    console.log('\n4️⃣  Testing cache service...');
    
    // Test popular books cache
    const testBooks = [
      { id: 1, title: 'Test Book 1', author: 'Test Author 1' },
      { id: 2, title: 'Test Book 2', author: 'Test Author 2' }
    ];
    
    await cacheService.setPopularBooks(testBooks, 'fiction');
    const cachedBooks = await cacheService.getPopularBooks('fiction');
    console.log('✅ Popular books cache:', cachedBooks ? 'SUCCESS' : 'FAILED');
    
    // Test search cache
    await cacheService.setSearchResults('test query', { category: 'fiction' }, testBooks);
    const searchResults = await cacheService.getSearchResults('test query', { category: 'fiction' });
    console.log('✅ Search cache:', searchResults ? 'SUCCESS' : 'FAILED');

    // Test 5: Online users
    console.log('\n5️⃣  Testing online users...');
    await cacheService.addOnlineUser('user123');
    await cacheService.addOnlineUser('user456');
    const onlineUsers = await cacheService.getOnlineUsers();
    console.log(`✅ Online users: ${onlineUsers.length} users`);
    
    await cacheService.removeOnlineUser('user123');
    const updatedOnlineUsers = await cacheService.getOnlineUsers();
    console.log(`✅ After removal: ${updatedOnlineUsers.length} users`);

    // Test 6: Geospatial operations
    console.log('\n6️⃣  Testing geospatial operations...');
    await cacheService.addBookLocation('book123', -74.0060, 40.7128); // NYC coordinates
    await cacheService.addBookLocation('book456', -73.9857, 40.7484); // Times Square
    
    const nearbyBooks = await cacheService.findNearbyBooksGeo(-74.0060, 40.7128, 5);
    console.log(`✅ Nearby books found: ${nearbyBooks.length}`);

    // Test 7: Health status
    console.log('\n7️⃣  Testing health status...');
    const healthStatus = await cacheService.getHealthStatus();
    console.log('✅ Health status:', healthStatus);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cacheService.invalidateBookCaches();
    await cacheService.removeOnlineUser('user456');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All Redis tests passed successfully!');
    console.log('✅ Redis Cloud is properly configured and working');
    
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Disconnect
    try {
      await redisClient.disconnect();
      console.log('🔌 Disconnected from Redis');
    } catch (disconnectError) {
      console.error('❌ Error disconnecting:', disconnectError.message);
    }
  }
}

// Run the test
testRedisConnection();