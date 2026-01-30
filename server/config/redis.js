import Redis from 'ioredis';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      // Parse Redis Cloud URL
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      console.log('🔄 Connecting to Redis Cloud...');
      console.log('Redis URL:', redisUrl.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

      // Redis Cloud configuration
      const redisConfig = {
        // Connection settings for Redis Cloud
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Enable keep-alive for cloud connections
        keepAlive: 30000,
        // Family 4 forces IPv4 (some cloud providers prefer this)
        family: 4,
        // TLS settings for secure connections (Redis Cloud uses TLS)
        tls: redisUrl.includes('rediss://') ? {} : undefined,
      };

      // Create Redis client with the full URL
      this.client = new Redis(redisUrl, redisConfig);

      // Event listeners
      this.client.on('connect', () => {
        console.log('✅ Redis Cloud connected successfully');
        this.isConnected = true;
        this.retryAttempts = 0;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis Cloud is ready to accept commands');
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis Cloud connection error:', error.message);
        this.isConnected = false;
        
        // Implement exponential backoff
        if (this.retryAttempts < this.maxRetries) {
          this.retryAttempts++;
          const delay = Math.pow(2, this.retryAttempts) * 1000;
          console.log(`🔄 Retrying Redis Cloud connection in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`);
        } else {
          console.error('❌ Max Redis Cloud connection retries exceeded');
        }
      });

      this.client.on('close', () => {
        console.log('🔌 Redis Cloud connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', (delay) => {
        console.log(`🔄 Redis Cloud reconnecting in ${delay}ms...`);
      });

      // Test connection with ping
      await this.client.ping();
      console.log('🏓 Redis Cloud ping successful');

      // Test basic operations
      await this.client.set('test:connection', 'success', 'EX', 10);
      const testResult = await this.client.get('test:connection');
      
      if (testResult === 'success') {
        console.log('✅ Redis Cloud basic operations test passed');
        await this.client.del('test:connection');
      } else {
        throw new Error('Redis Cloud basic operations test failed');
      }

      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis Cloud:', error.message);
      console.log('⚠️  Application will continue without Redis caching');
      this.isConnected = false;
      return null;
    }
  }

  // Graceful fallback methods
  async get(key) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  // Pattern-based operations
  async keys(pattern) {
    if (!this.isConnected || !this.client) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error.message);
      return [];
    }
  }

  async flushPattern(pattern) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Redis FLUSH PATTERN error for ${pattern}:`, error.message);
      return false;
    }
  }

  // Geospatial operations for location-based features
  async geoAdd(key, longitude, latitude, member) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.geoadd(key, longitude, latitude, member);
      return true;
    } catch (error) {
      console.error(`Redis GEOADD error:`, error.message);
      return false;
    }
  }

  async geoRadius(key, longitude, latitude, radius, unit = 'km') {
    if (!this.isConnected || !this.client) return [];
    
    try {
      return await this.client.georadius(key, longitude, latitude, radius, unit, 'WITHDIST');
    } catch (error) {
      console.error(`Redis GEORADIUS error:`, error.message);
      return [];
    }
  }

  // Set operations for online users
  async sadd(key, ...members) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.sadd(key, ...members);
      return true;
    } catch (error) {
      console.error(`Redis SADD error:`, error.message);
      return false;
    }
  }

  async srem(key, ...members) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.srem(key, ...members);
      return true;
    } catch (error) {
      console.error(`Redis SREM error:`, error.message);
      return false;
    }
  }

  async smembers(key) {
    if (!this.isConnected || !this.client) return [];
    
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error:`, error.message);
      return [];
    }
  }

  // Health check
  async ping() {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error.message);
      return false;
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.error('❌ Error during Redis disconnect:', error.message);
      }
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;