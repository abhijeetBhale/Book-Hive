import cacheService from '../services/cacheService.js';

// Cache-enhanced wrapper for book controller methods
class CachedBookController {
  constructor(originalController) {
    this.originalController = originalController;
    
    // Pass through methods that don't need caching (assign in constructor)
    this.getUserBooks = this.originalController.getUserBooks || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
    this.getMyBooks = this.originalController.getMyBooks || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
    this.searchByISBN = this.originalController.searchByISBN || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
    this.validateBookPrice = this.originalController.validateBookPrice || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
    this.getBooksForSale = this.originalController.getBooksForSale || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
    this.getEnhancedFilters = this.originalController.getEnhancedFilters || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
    this.getPersonalizedRecommendations = this.originalController.getPersonalizedRecommendations || ((req, res) => res.status(501).json({ message: 'Method not implemented' }));
  }

  // Enhanced getAllBooks with caching
  getAllBooks = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20,
        search = '',
        category = '',
        author = '',
        condition = '',
        language = '',
        genre = '',
        minYear = '',
        maxYear = '',
        isAvailable = '',
        forBorrowing = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        latitude = '',
        longitude = '',
        maxDistance = '50000',
        isbn = '',
        tags = ''
      } = req.query;

      // Create cache key based on search parameters
      const cacheKey = await this.createSearchCacheKey({
        page, limit, search, category, author, condition, language, genre,
        minYear, maxYear, isAvailable, forBorrowing, sortBy, sortOrder,
        latitude, longitude, maxDistance, isbn, tags
      });

      // Try to get from cache first
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        console.log(`📦 Cache HIT: Book search - ${cacheKey}`);
        return res.json(cachedResult);
      }

      console.log(`📭 Cache MISS: Book search - ${cacheKey}`);

      // If not in cache, get from database
      const originalJson = res.json;
      res.json = (data) => {
        // Cache the result before sending response
        if (data && data.books && !data.error) {
          // Only cache successful responses with reasonable size
          if (data.books.length <= 100) {
            cacheService.setSearchResults(
              search || 'all',
              { category, author, condition, sortBy, sortOrder },
              data
            );
          }
        }
        originalJson.call(res, data);
      };

      // Call original method
      return this.originalController.getAllBooks(req, res);

    } catch (error) {
      console.error('Cached getAllBooks error:', error);
      return this.originalController.getAllBooks(req, res);
    }
  };

  // Enhanced getBookById with caching
  getBookById = async (req, res) => {
    try {
      const bookId = req.params.id;
      const cacheKey = `book:details:${bookId}`;

      // Try cache first
      const cachedBook = await cacheService.get(cacheKey);
      if (cachedBook) {
        console.log(`📦 Cache HIT: Book details - ${bookId}`);
        return res.json(cachedBook);
      }

      console.log(`📭 Cache MISS: Book details - ${bookId}`);

      // Intercept response to cache it
      const originalJson = res.json;
      res.json = (data) => {
        if (data && !data.error && data._id) {
          // Cache book details for 30 minutes
          cacheService.set(cacheKey, data, 1800);
        }
        originalJson.call(res, data);
      };

      return this.originalController.getBookById(req, res);

    } catch (error) {
      console.error('Cached getBookById error:', error);
      return this.originalController.getBookById(req, res);
    }
  };

  // Enhanced getTrendingBooks with caching
  getTrendingBooks = async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const cacheKey = `books:trending:${limit}`;

      const cachedTrending = await cacheService.get(cacheKey);
      if (cachedTrending) {
        console.log(`📦 Cache HIT: Trending books`);
        return res.json(cachedTrending);
      }

      console.log(`📭 Cache MISS: Trending books`);

      const originalJson = res.json;
      res.json = (data) => {
        if (data && data.books && !data.error) {
          // Cache trending books for 1 hour
          cacheService.set(cacheKey, data, 3600);
        }
        originalJson.call(res, data);
      };

      return this.originalController.getTrendingBooks(req, res);

    } catch (error) {
      console.error('Cached getTrendingBooks error:', error);
      return this.originalController.getTrendingBooks(req, res);
    }
  };

  // Enhanced getBookSuggestions with caching
  getBookSuggestions = async (req, res) => {
    try {
      const userId = req.user._id;
      const { limit = 10 } = req.query;
      const cacheKey = `suggestions:${userId}:${limit}`;

      const cachedSuggestions = await cacheService.get(cacheKey);
      if (cachedSuggestions) {
        console.log(`📦 Cache HIT: Book suggestions for user ${userId}`);
        return res.json(cachedSuggestions);
      }

      console.log(`📭 Cache MISS: Book suggestions for user ${userId}`);

      const originalJson = res.json;
      res.json = (data) => {
        if (data && data.books && !data.error) {
          // Cache suggestions for 30 minutes (shorter TTL for personalized content)
          cacheService.set(cacheKey, data, 1800);
        }
        originalJson.call(res, data);
      };

      return this.originalController.getBookSuggestions(req, res);

    } catch (error) {
      console.error('Cached getBookSuggestions error:', error);
      return this.originalController.getBookSuggestions(req, res);
    }
  };

  // Enhanced getNearbyBooks with geospatial caching
  getNearbyBooks = async (req, res) => {
    try {
      const { latitude, longitude, maxDistance = 10 } = req.query;
      
      if (!latitude || !longitude) {
        return this.originalController.getAllBooks(req, res);
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radius = parseInt(maxDistance);

      // Try geospatial cache first
      const cachedNearby = await cacheService.getNearbyBooks(lat, lng, radius);
      if (cachedNearby) {
        console.log(`📦 Cache HIT: Nearby books at ${lat},${lng}`);
        return res.json(cachedNearby);
      }

      console.log(`📭 Cache MISS: Nearby books at ${lat},${lng}`);

      const originalJson = res.json;
      res.json = (data) => {
        if (data && data.books && !data.error) {
          // Cache nearby books for 30 minutes
          cacheService.setNearbyBooks(lat, lng, radius, data);
        }
        originalJson.call(res, data);
      };

      return this.originalController.getAllBooks(req, res);

    } catch (error) {
      console.error('Cached getNearbyBooks error:', error);
      return this.originalController.getAllBooks(req, res);
    }
  };

  // Enhanced getFilterOptions with caching
  getFilterOptions = async (req, res) => {
    try {
      const cacheKey = 'books:filters:options';

      const cachedFilters = await cacheService.get(cacheKey);
      if (cachedFilters) {
        console.log(`📦 Cache HIT: Filter options`);
        return res.json(cachedFilters);
      }

      console.log(`📭 Cache MISS: Filter options`);

      const originalJson = res.json;
      res.json = (data) => {
        if (data && !data.error) {
          // Cache filter options for 24 hours (they don't change often)
          cacheService.set(cacheKey, data, 86400);
        }
        originalJson.call(res, data);
      };

      return this.originalController.getFilterOptions(req, res);

    } catch (error) {
      console.error('Cached getFilterOptions error:', error);
      return this.originalController.getFilterOptions(req, res);
    }
  };

  // Cache invalidation methods
  invalidateBookCaches = async (bookId = null) => {
    try {
      if (bookId) {
        // Invalidate specific book cache
        await cacheService.del(`book:details:${bookId}`);
      }
      
      // Invalidate general book caches
      await cacheService.invalidateBookCaches();
      
      console.log('🧹 Book caches invalidated');
    } catch (error) {
      console.error('Error invalidating book caches:', error);
    }
  };

  // Enhanced createBook with cache invalidation
  createBook = async (req, res) => {
    try {
      const originalJson = res.json;
      res.json = async (data) => {
        if (data && data._id && !data.error) {
          // Invalidate relevant caches when new book is created
          await this.invalidateBookCaches();
          
          // Add book to geospatial cache if user has location
          if (req.user.location && req.user.location.coordinates) {
            const [lng, lat] = req.user.location.coordinates;
            await cacheService.addBookLocation(data._id, lng, lat);
          }
        }
        originalJson.call(res, data);
      };

      return this.originalController.createBook(req, res);

    } catch (error) {
      console.error('Cached createBook error:', error);
      return this.originalController.createBook(req, res);
    }
  };

  // Enhanced updateBook with cache invalidation
  updateBook = async (req, res) => {
    try {
      const bookId = req.params.id;
      
      const originalJson = res.json;
      res.json = async (data) => {
        if (data && data._id && !data.error) {
          // Invalidate specific book cache and related caches
          await this.invalidateBookCaches(bookId);
        }
        originalJson.call(res, data);
      };

      return this.originalController.updateBook(req, res);

    } catch (error) {
      console.error('Cached updateBook error:', error);
      return this.originalController.updateBook(req, res);
    }
  };

  // Enhanced deleteBook with cache invalidation
  deleteBook = async (req, res) => {
    try {
      const bookId = req.params.id;
      
      const originalJson = res.json;
      res.json = async (data) => {
        if (data && !data.error) {
          // Invalidate all related caches when book is deleted
          await this.invalidateBookCaches(bookId);
        }
        originalJson.call(res, data);
      };

      return this.originalController.deleteBook(req, res);

    } catch (error) {
      console.error('Cached deleteBook error:', error);
      return this.originalController.deleteBook(req, res);
    }
  };

  // Utility methods
  async createSearchCacheKey(params) {
    const crypto = await import('crypto');
    const searchString = JSON.stringify(params);
    return `books:search:${crypto.createHash('md5').update(searchString).digest('hex').substring(0, 12)}`;
  }
}

export default CachedBookController;