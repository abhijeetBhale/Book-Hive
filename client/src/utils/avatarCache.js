// Simple avatar cache to improve loading performance
class AvatarCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
  }

  // Preload an avatar image
  preload(url) {
    if (!url || this.cache.has(url) || this.preloadQueue.has(url)) {
      return Promise.resolve();
    }

    this.preloadQueue.add(url);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, {
          loaded: true,
          timestamp: Date.now(),
          element: img
        });
        this.preloadQueue.delete(url);
        resolve(img);
      };
      
      img.onerror = () => {
        this.preloadQueue.delete(url);
        reject(new Error(`Failed to load avatar: ${url}`));
      };
      
      img.src = url;
    });
  }

  // Check if avatar is cached
  isCached(url) {
    return this.cache.has(url);
  }

  // Get cached avatar
  getCached(url) {
    return this.cache.get(url);
  }

  // Clear old cache entries (older than 1 hour)
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.cache.delete(url);
      }
    }
  }

  // Preload multiple avatars
  preloadBatch(urls) {
    return Promise.allSettled(
      urls.filter(url => url).map(url => this.preload(url))
    );
  }
}

// Create singleton instance
const avatarCache = new AvatarCache();

// Cleanup cache every 30 minutes
setInterval(() => {
  avatarCache.cleanup();
}, 30 * 60 * 1000);

export default avatarCache;