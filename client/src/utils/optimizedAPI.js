/**
 * Optimized API Wrapper with Caching and Performance Enhancements
 */
import performanceCache from './performanceCache.js';

// Request deduplication map
const pendingRequests = new Map();

/**
 * Enhanced API wrapper with caching and deduplication
 */
export const createOptimizedAPI = (originalAPI) => {
  const optimizedAPI = {};

  Object.keys(originalAPI).forEach(key => {
    const originalMethod = originalAPI[key];
    
    optimizedAPI[key] = async (...args) => {
      // Generate cache key based on method and arguments
      const cacheKey = `${key}_${JSON.stringify(args)}`;
      
      // Check cache first for GET-like operations
      if (shouldCache(key)) {
        const cached = performanceCache.get(cacheKey);
        if (cached) {
          return { data: cached };
        }
      }

      // Check for pending identical requests (deduplication)
      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
      }

      // Create the request promise
      const requestPromise = originalMethod(...args)
        .then(response => {
          // Cache successful responses for appropriate methods
          if (shouldCache(key) && response.data) {
            const duration = getCacheDuration(key);
            performanceCache.set(cacheKey, response.data, duration);
          }
          
          // Remove from pending requests
          pendingRequests.delete(cacheKey);
          
          return response;
        })
        .catch(error => {
          // Remove from pending requests on error
          pendingRequests.delete(cacheKey);
          throw error;
        });

      // Store pending request for deduplication
      pendingRequests.set(cacheKey, requestPromise);

      return requestPromise;
    };
  });

  return optimizedAPI;
};

/**
 * Determine if a method should be cached
 */
const shouldCache = (methodName) => {
  const cacheableMethods = [
    'getProfile',
    'getAll',
    'getById',
    'getUsersWithBooks',
    'getUserLocation',
    'getPublicEvents',
    'getEventDetails',
    'listForUser',
    'getUnreadCount',
    'getAll', // notifications
    'getMyRequests',
    'getConversations'
  ];
  
  return cacheableMethods.some(method => methodName.includes(method) || methodName.endsWith(method));
};

/**
 * Get cache duration based on method type
 */
const getCacheDuration = (methodName) => {
  if (methodName.includes('Profile') || methodName.includes('User')) {
    return performanceCache.CACHE_DURATION.user;
  }
  
  if (methodName.includes('Book') || methodName.includes('Event')) {
    return performanceCache.CACHE_DURATION.books;
  }
  
  if (methodName.includes('notification') || methodName.includes('Unread')) {
    return performanceCache.CACHE_DURATION.short;
  }
  
  return performanceCache.CACHE_DURATION.short;
};

/**
 * Clear cache for specific patterns
 */
export const clearCachePattern = (pattern) => {
  // This would need to be implemented based on your cache structure
  console.log(`Clearing cache for pattern: ${pattern}`);
};

/**
 * Preload critical data
 */
export const preloadCriticalData = async (authAPI, booksAPI) => {
  try {
    // Preload user profile
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getProfile().catch(() => {}); // Silent fail
    }
    
    // Preload popular books
    booksAPI.getAll({ limit: 20, sort: 'popular' }).catch(() => {}); // Silent fail
  } catch (error) {
    // Silent fail for preloading
  }
};

export default {
  createOptimizedAPI,
  clearCachePattern,
  preloadCriticalData
};