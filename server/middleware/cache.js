// Simple in-memory cache middleware for API responses
const cache = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minute

export const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      const { data, timestamp } = cachedResponse;
      const age = Date.now() - timestamp;

      if (age < duration) {
        console.log(`Cache HIT for ${key} (age: ${age}ms)`);
        return res.json(data);
      } else {
        // Cache expired, delete it
        cache.delete(key);
      }
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (data) => {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
      console.log(`Cache SET for ${key}`);
      return originalJson(data);
    };

    next();
  };
};

// Clear cache for specific routes
export const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      console.log(`Cache CLEARED for ${key}`);
    }
  }
};

// Clear all cache
export const clearAllCache = () => {
  cache.clear();
  console.log('All cache CLEARED');
};

export default cacheMiddleware;
