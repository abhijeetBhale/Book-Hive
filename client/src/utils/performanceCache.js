/**
 * Performance Cache Utility
 * Provides intelligent caching for API responses and user data
 */

class PerformanceCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = {
      user: 10 * 60 * 1000, // 10 minutes
      books: 5 * 60 * 1000, // 5 minutes
      static: 30 * 60 * 1000, // 30 minutes
      short: 2 * 60 * 1000, // 2 minutes
    };
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${paramString ? '?' + paramString : ''}`;
  }

  /**
   * Set cache entry with expiration
   */
  set(key, data, duration = this.CACHE_DURATION.short) {
    const entry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + duration
    };
    
    this.cache.set(key, entry);
    
    // Also store in localStorage for persistence across sessions
    try {
      const persistentData = {
        ...entry,
        key
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(persistentData));
    } catch (error) {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  }

  /**
   * Get cache entry if not expired
   */
  get(key) {
    // Check memory cache first
    let entry = this.cache.get(key);
    
    // If not in memory, check localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          // Restore to memory cache
          this.cache.set(key, entry);
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    
    // Clear localStorage cache entries
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }

    // Clean localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (now > entry.expires) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memoryEntries: this.cache.size,
      localStorageEntries: Object.keys(localStorage).filter(k => k.startsWith('cache_')).length
    };
  }
}

// Create singleton instance
const performanceCache = new PerformanceCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  performanceCache.cleanup();
}, 5 * 60 * 1000);

export default performanceCache;