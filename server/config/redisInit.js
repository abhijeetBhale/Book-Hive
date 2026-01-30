import redisClient from './redis.js';
import cacheService from '../services/cacheService.js';

class RedisInitializer {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('🔄 Redis already initialized');
      return true;
    }

    try {
      console.log('🚀 Initializing Redis connection...');
      
      // Connect to Redis Cloud
      const client = await redisClient.connect();
      
      if (client) {
        console.log('✅ Redis Cloud connected successfully');
        
        // Test cache service
        await this.testCacheService();
        
        // Warm cache with initial data (optional)
        await this.warmInitialCache();
        
        this.isInitialized = true;
        return true;
      } else {
        console.log('⚠️  Redis connection failed, continuing without cache');
        return false;
      }
    } catch (error) {
      console.error('❌ Redis initialization failed:', error.message);
      console.log('⚠️  Application will continue without Redis caching');
      return false;
    }
  }

  async testCacheService() {
    try {
      console.log('🧪 Testing cache service...');
      
      // Test basic cache operations
      const testKey = 'test:init';
      const testData = { message: 'Redis is working!', timestamp: new Date().toISOString() };
      
      await cacheService.set(testKey, testData, 60); // 1 minute TTL
      const retrieved = await cacheService.get(testKey);
      
      if (retrieved && retrieved.message === testData.message) {
        console.log('✅ Cache service test passed');
        await cacheService.del(testKey); // Cleanup
      } else {
        throw new Error('Cache service test failed');
      }
    } catch (error) {
      console.error('❌ Cache service test failed:', error.message);
      throw error;
    }
  }

  async warmInitialCache() {
    try {
      console.log('🔥 Warming initial cache...');
      
      // You can add initial cache warming here
      // For example, cache popular books, community stats, etc.
      
      console.log('✅ Initial cache warming completed');
    } catch (error) {
      console.error('⚠️  Cache warming failed:', error.message);
      // Don't throw error, cache warming is optional
    }
  }

  async getStatus() {
    try {
      const healthStatus = await cacheService.getHealthStatus();
      return {
        initialized: this.isInitialized,
        ...healthStatus
      };
    } catch (error) {
      return {
        initialized: this.isInitialized,
        connected: false,
        error: error.message
      };
    }
  }

  async shutdown() {
    try {
      console.log('🔄 Shutting down Redis connection...');
      await redisClient.disconnect();
      this.isInitialized = false;
      console.log('✅ Redis disconnected gracefully');
    } catch (error) {
      console.error('❌ Error during Redis shutdown:', error.message);
    }
  }
}

export default new RedisInitializer();