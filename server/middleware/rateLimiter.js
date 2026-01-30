import redisClient from '../config/redis.js';

class RateLimiter {
  constructor() {
    this.limits = {
      // API endpoints rate limits (requests per window)
      search: { requests: 100, window: 3600 }, // 100 searches per hour
      auth: { requests: 5, window: 900 }, // 5 login attempts per 15 minutes
      upload: { requests: 10, window: 3600 }, // 10 uploads per hour
      message: { requests: 50, window: 3600 }, // 50 messages per hour
      general: { requests: 1000, window: 3600 }, // 1000 general requests per hour
    };
  }

  // Generic rate limiter
  async checkRateLimit(identifier, limitType = 'general') {
    const limit = this.limits[limitType];
    if (!limit) {
      console.error(`Unknown rate limit type: ${limitType}`);
      return { allowed: true, remaining: 999 };
    }

    const key = `ratelimit:${limitType}:${identifier}`;
    
    try {
      // If Redis is not available, allow the request
      if (!redisClient.isConnected) {
        return { allowed: true, remaining: limit.requests };
      }

      // Get current count
      const current = await redisClient.client.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= limit.requests) {
        // Rate limit exceeded
        const ttl = await redisClient.client.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (ttl * 1000),
          message: `Rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes.`
        };
      }

      // Increment counter
      const newCount = count + 1;
      if (count === 0) {
        // First request in window, set with expiration
        await redisClient.client.setex(key, limit.window, newCount);
      } else {
        // Increment existing counter
        await redisClient.client.incr(key);
      }

      return {
        allowed: true,
        remaining: limit.requests - newCount,
        resetTime: Date.now() + (limit.window * 1000)
      };

    } catch (error) {
      console.error(`Rate limiter error for ${key}:`, error.message);
      // On error, allow the request (fail open)
      return { allowed: true, remaining: limit.requests };
    }
  }

  // Middleware factory
  createMiddleware(limitType = 'general', getIdentifier = null) {
    return async (req, res, next) => {
      try {
        // Determine identifier (IP, user ID, or custom)
        let identifier;
        if (getIdentifier && typeof getIdentifier === 'function') {
          identifier = getIdentifier(req);
        } else if (req.user && req.user._id) {
          identifier = req.user._id.toString();
        } else {
          identifier = req.ip || req.connection.remoteAddress;
        }

        const result = await this.checkRateLimit(identifier, limitType);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.limits[limitType].requests,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime ? new Date(result.resetTime).toISOString() : null,
        });

        if (!result.allowed) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: result.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiter middleware error:', error.message);
        // On error, allow the request to proceed
        next();
      }
    };
  }

  // Specific middleware for different endpoints
  searchLimiter() {
    return this.createMiddleware('search');
  }

  authLimiter() {
    return this.createMiddleware('auth', (req) => req.ip);
  }

  uploadLimiter() {
    return this.createMiddleware('upload');
  }

  messageLimiter() {
    return this.createMiddleware('message');
  }

  generalLimiter() {
    return this.createMiddleware('general');
  }

  // Admin method to reset rate limits
  async resetRateLimit(identifier, limitType) {
    const key = `ratelimit:${limitType}:${identifier}`;
    try {
      await redisClient.del(key);
      console.log(`Rate limit reset for ${key}`);
      return true;
    } catch (error) {
      console.error(`Error resetting rate limit for ${key}:`, error.message);
      return false;
    }
  }

  // Get current rate limit status
  async getRateLimitStatus(identifier, limitType) {
    const key = `ratelimit:${limitType}:${identifier}`;
    try {
      const current = await redisClient.client.get(key);
      const ttl = await redisClient.client.ttl(key);
      const limit = this.limits[limitType];

      return {
        current: current ? parseInt(current) : 0,
        limit: limit.requests,
        remaining: limit.requests - (current ? parseInt(current) : 0),
        resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null,
      };
    } catch (error) {
      console.error(`Error getting rate limit status for ${key}:`, error.message);
      return null;
    }
  }
}

export default new RateLimiter();