import redisClient from '../config/redis.js';

class CacheService {
  constructor() {
    // TTL constants (in seconds)
    this.TTL = {
      DEFAULT: parseInt(process.env.REDIS_TTL_DEFAULT) || 3600, // 1 hour
      SESSION: parseInt(process.env.REDIS_TTL_SESSION) || 604800, // 7 days
      SEARCH: parseInt(process.env.REDIS_TTL_SEARCH) || 3600, // 1 hour
      GEO: parseInt(process.env.REDIS_TTL_GEO) || 1800, // 30 minutes
      POPULAR: 86400, // 24 hours
      STATS: 3600, // 1 hour
      ONLINE_USERS: 300, // 5 minutes
    };

    // Key prefixes for organization
    this.KEYS = {
      BOOKS_POPULAR: 'books:popular',
      BOOKS_SEARCH: 'books:search',
      BOOKS_NEARBY: 'books:nearby',
      USER_SESSION: 'user:session',
      USER_ONLINE: 'users:online',
      STATS_COMMUNITY: 'stats:community',
      GEO_BOOKS: 'geo:books',
      GEO_USERS: 'geo:users',
    };
  }

  // Generic cache methods with fallback
  async get(key) {
    try {
      const result = await redisClient.get(key);
      if (result) {
        console.log(`📦 Cache HIT: ${key}`);
        return result;
      }
      console.log(`📭 Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error(`Cache GET error for ${key}:`, error.message);
      return null;
    }
  }

  async set(key, data, ttl = this.TTL.DEFAULT) {
    try {
      const success = await redisClient.set(key, data, ttl);
      if (success) {
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      }
      return success;
    } catch (error) {
      console.error(`Cache SET error for ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    try {
      const success = await redisClient.del(key);
      if (success) {
        console.log(`🗑️  Cache DEL: ${key}`);
      }
      return success;
    } catch (error) {
      console.error(`Cache DEL error for ${key}:`, error.message);
      return false;
    }
  }

  // Book-specific cache methods
  async getPopularBooks(category = 'all') {
    const key = `${this.KEYS.BOOKS_POPULAR}:${category}`;
    return await this.get(key);
  }

  async setPopularBooks(books, category = 'all') {
    const key = `${this.KEYS.BOOKS_POPULAR}:${category}`;
    return await this.set(key, books, this.TTL.POPULAR);
  }

  async getSearchResults(query, filters = {}) {
    // Create a hash of the search parameters for consistent caching
    const searchHash = await this.createSearchHash(query, filters);
    const key = `${this.KEYS.BOOKS_SEARCH}:${searchHash}`;
    return await this.get(key);
  }

  async setSearchResults(query, filters, results) {
    const searchHash = await this.createSearchHash(query, filters);
    const key = `${this.KEYS.BOOKS_SEARCH}:${searchHash}`;
    return await this.set(key, results, this.TTL.SEARCH);
  }

  async getNearbyBooks(latitude, longitude, radius = 10) {
    const key = `${this.KEYS.BOOKS_NEARBY}:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radius}`;
    return await this.get(key);
  }

  async setNearbyBooks(latitude, longitude, radius, books) {
    const key = `${this.KEYS.BOOKS_NEARBY}:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radius}`;
    return await this.set(key, books, this.TTL.GEO);
  }

  // User session methods
  async getUserSession(userId) {
    const key = `${this.KEYS.USER_SESSION}:${userId}`;
    return await this.get(key);
  }

  async setUserSession(userId, sessionData) {
    const key = `${this.KEYS.USER_SESSION}:${userId}`;
    return await this.set(key, sessionData, this.TTL.SESSION);
  }

  async deleteUserSession(userId) {
    const key = `${this.KEYS.USER_SESSION}:${userId}`;
    return await this.del(key);
  }

  // Online users management
  async addOnlineUser(userId) {
    try {
      const success = await redisClient.sadd(this.KEYS.USER_ONLINE, userId);
      if (success) {
        // Set expiration for the entire set
        await redisClient.client.expire(this.KEYS.USER_ONLINE, this.TTL.ONLINE_USERS);
        console.log(`👤 User ${userId} marked as online`);
      }
      return success;
    } catch (error) {
      console.error(`Error adding online user ${userId}:`, error.message);
      return false;
    }
  }

  async removeOnlineUser(userId) {
    try {
      const success = await redisClient.srem(this.KEYS.USER_ONLINE, userId);
      if (success) {
        console.log(`👤 User ${userId} marked as offline`);
      }
      return success;
    } catch (error) {
      console.error(`Error removing online user ${userId}:`, error.message);
      return false;
    }
  }

  async getOnlineUsers() {
    try {
      return await redisClient.smembers(this.KEYS.USER_ONLINE);
    } catch (error) {
      console.error('Error getting online users:', error.message);
      return [];
    }
  }

  // Community stats caching
  async getCommunityStats() {
    return await this.get(this.KEYS.STATS_COMMUNITY);
  }

  async setCommunityStats(stats) {
    return await this.set(this.KEYS.STATS_COMMUNITY, stats, this.TTL.STATS);
  }

  // Geospatial operations for books and users
  async addBookLocation(bookId, longitude, latitude) {
    try {
      return await redisClient.geoAdd(this.KEYS.GEO_BOOKS, longitude, latitude, bookId);
    } catch (error) {
      console.error(`Error adding book location for ${bookId}:`, error.message);
      return false;
    }
  }

  async findNearbyBooksGeo(longitude, latitude, radius = 10) {
    try {
      return await redisClient.geoRadius(this.KEYS.GEO_BOOKS, longitude, latitude, radius, 'km');
    } catch (error) {
      console.error('Error finding nearby books:', error.message);
      return [];
    }
  }

  // Cache invalidation methods
  async invalidateBookCaches() {
    try {
      await redisClient.flushPattern(`${this.KEYS.BOOKS_POPULAR}:*`);
      await redisClient.flushPattern(`${this.KEYS.BOOKS_SEARCH}:*`);
      await redisClient.flushPattern(`${this.KEYS.BOOKS_NEARBY}:*`);
      console.log('🧹 Book caches invalidated');
      return true;
    } catch (error) {
      console.error('Error invalidating book caches:', error.message);
      return false;
    }
  }

  async invalidateUserCaches(userId) {
    try {
      await this.deleteUserSession(userId);
      await this.removeOnlineUser(userId);
      console.log(`🧹 User ${userId} caches invalidated`);
      return true;
    } catch (error) {
      console.error(`Error invalidating user ${userId} caches:`, error.message);
      return false;
    }
  }

  // Utility methods
  async createSearchHash(query, filters) {
    const crypto = await import('crypto');
    const searchString = JSON.stringify({ query: query.toLowerCase(), filters });
    return crypto.createHash('md5').update(searchString).digest('hex').substring(0, 8);
  }

  // Cache warming methods (for popular data)
  async warmCache() {
    console.log('🔥 Starting cache warming...');
    
    try {
      // This would be called during server startup
      // Implementation depends on your existing MongoDB queries
      console.log('🔥 Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming failed:', error.message);
    }
  }

  // Health check and monitoring
  async getHealthStatus() {
    try {
      const isConnected = await redisClient.ping();
      const onlineUsersCount = await this.getOnlineUsers();
      
      return {
        connected: isConnected,
        onlineUsers: onlineUsersCount.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new CacheService();