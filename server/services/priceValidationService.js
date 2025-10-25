import axios from 'axios';
import BookApiService from './bookApiService.js';

class PriceValidationService {
  constructor() {
    this.bookApiService = new BookApiService();
    this.priceApis = {
      amazon: 'https://api.rainforestapi.com/request', // Requires API key
      googleShopping: 'https://www.googleapis.com/customsearch/v1', // Requires API key
      bookFinder: 'https://www.bookfinder.com/search/', // Web scraping (use carefully)
    };
    
    this.apiKeys = {
      rainforest: process.env.RAINFOREST_API_KEY,
      googleShopping: process.env.GOOGLE_SHOPPING_API_KEY,
      googleCustomSearch: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
    };
  }

  /**
   * Validate book price against market prices
   * @param {Object} bookData - Book information
   * @param {number} userPrice - Price set by user
   * @returns {Object} Validation result
   */
  async validateBookPrice(bookData, userPrice) {
    try {
      const { title, author, isbn } = bookData;
      
      // Get market prices from multiple sources
      const marketPrices = await this.getMarketPrices(title, author, isbn);
      
      if (marketPrices.length === 0) {
        return {
          isValidated: false,
          error: 'Could not find market price data for this book',
          suggestion: 'Please research the book price manually and ensure it\'s reasonable'
        };
      }

      // Calculate average market price
      const avgMarketPrice = marketPrices.reduce((sum, price) => sum + price.price, 0) / marketPrices.length;
      const lowestMarketPrice = Math.min(...marketPrices.map(p => p.price));
      
      // Calculate percentage difference
      const percentageDifference = ((userPrice - avgMarketPrice) / avgMarketPrice) * 100;
      
      // Determine if price is reasonable (should be at or below market price)
      const isReasonable = userPrice <= avgMarketPrice * 1.1; // Allow 10% above market for good condition
      
      return {
        isValidated: true,
        validatedAt: new Date(),
        marketSources: marketPrices.map(p => p.source),
        priceComparison: {
          userPrice,
          marketPrice: avgMarketPrice,
          lowestMarketPrice,
          percentageDifference: Math.round(percentageDifference * 100) / 100,
          isReasonable,
        },
        marketPrices,
        recommendation: this.generatePriceRecommendation(userPrice, avgMarketPrice, lowestMarketPrice, isReasonable)
      };
    } catch (error) {
      console.error('Price validation error:', error);
      return {
        isValidated: false,
        error: 'Failed to validate price due to technical issues',
        suggestion: 'Please try again later or research the book price manually'
      };
    }
  }

  /**
   * Get market prices from various sources
   * @param {string} title - Book title
   * @param {string} author - Book author
   * @param {string} isbn - Book ISBN
   * @returns {Array} Array of price objects
   */
  async getMarketPrices(title, author, isbn) {
    const prices = [];
    
    // Try multiple sources in parallel
    const pricePromises = [
      this.getAmazonPrice(title, author, isbn),
      this.getGoogleShoppingPrice(title, author, isbn),
      this.getBookFinderPrice(title, author, isbn),
      this.getGenericWebPrice(title, author, isbn)
    ];

    const results = await Promise.allSettled(pricePromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        prices.push(result.value);
      }
    });

    return prices;
  }

  /**
   * Get price from Amazon (requires Rainforest API)
   */
  async getAmazonPrice(title, author, isbn) {
    if (!this.apiKeys.rainforest) {
      return null;
    }

    try {
      const searchQuery = isbn || `${title} ${author}`;
      const response = await axios.get(this.priceApis.amazon, {
        params: {
          api_key: this.apiKeys.rainforest,
          type: 'search',
          search_term: searchQuery,
          domain: 'amazon.com'
        },
        timeout: 10000
      });

      if (response.data.search_results && response.data.search_results.length > 0) {
        const book = response.data.search_results[0];
        if (book.price && book.price.value) {
          return {
            source: 'Amazon',
            price: parseFloat(book.price.value),
            currency: book.price.currency || 'INR',
            condition: 'new',
            url: book.link
          };
        }
      }
    } catch (error) {
      console.error('Amazon price fetch error:', error);
    }
    
    return null;
  }

  /**
   * Get price from Google Shopping
   */
  async getGoogleShoppingPrice(title, author, isbn) {
    if (!this.apiKeys.googleShopping || !this.apiKeys.googleCustomSearch) {
      return null;
    }

    try {
      const searchQuery = isbn || `${title} ${author} book price`;
      const response = await axios.get(this.priceApis.googleShopping, {
        params: {
          key: this.apiKeys.googleShopping,
          cx: this.apiKeys.googleCustomSearch,
          q: searchQuery,
          searchType: 'image',
          num: 5
        },
        timeout: 10000
      });

      // This is a simplified implementation
      // In practice, you'd need to parse the results for price information
      return null;
    } catch (error) {
      console.error('Google Shopping price fetch error:', error);
    }
    
    return null;
  }

  /**
   * Get price from BookFinder (web scraping - use carefully)
   */
  async getBookFinderPrice(title, author, isbn) {
    // Note: Web scraping should be done carefully and in compliance with terms of service
    // This is a placeholder implementation
    return null;
  }

  /**
   * Generic web search for book prices
   */
  async getGenericWebPrice(title, author, isbn) {
    try {
      // Use a simple approach: search for common book retailers
      const retailers = [
        { name: 'Barnes & Noble', baseUrl: 'https://www.barnesandnoble.com' },
        { name: 'Books-A-Million', baseUrl: 'https://www.booksamillion.com' },
        { name: 'Thriftbooks', baseUrl: 'https://www.thriftbooks.com' }
      ];

      // For now, return mock data based on book category and publication year
      // In a real implementation, you'd scrape or use APIs
      return this.generateEstimatedPrice(title, author, isbn);
    } catch (error) {
      console.error('Generic web price fetch error:', error);
    }
    
    return null;
  }

  /**
   * Generate estimated price based on book characteristics
   */
  generateEstimatedPrice(title, author, isbn) {
    // This is a fallback method that estimates price based on common patterns
    // In a real implementation, you'd use actual market data
    
    let basePrice = 15; // Base price for books
    
    // Adjust based on title keywords
    const expensiveKeywords = ['textbook', 'medical', 'law', 'engineering', 'computer science', 'programming'];
    const cheapKeywords = ['romance', 'fiction', 'mystery', 'cookbook'];
    
    const titleLower = title.toLowerCase();
    
    if (expensiveKeywords.some(keyword => titleLower.includes(keyword))) {
      basePrice *= 3; // Textbooks are typically more expensive
    } else if (cheapKeywords.some(keyword => titleLower.includes(keyword))) {
      basePrice *= 0.7; // Popular fiction is typically cheaper
    }

    // Add some randomness to simulate market variation
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    const estimatedPrice = basePrice * (1 + variation);

    return {
      source: 'Estimated',
      price: Math.round(estimatedPrice * 100) / 100,
      currency: 'INR',
      condition: 'used',
      note: 'Estimated price based on book characteristics'
    };
  }

  /**
   * Generate price recommendation message
   */
  generatePriceRecommendation(userPrice, marketPrice, lowestPrice, isReasonable) {
    if (isReasonable) {
      if (userPrice <= lowestPrice) {
        return {
          type: 'success',
          message: `Great price! Your price of ₹${userPrice} is at or below the lowest market price of ₹${lowestPrice}.`,
          suggestion: 'This is an excellent deal for buyers.'
        };
      } else {
        return {
          type: 'success',
          message: `Good price! Your price of ₹${userPrice} is reasonable compared to the average market price of ₹${marketPrice.toFixed(2)}.`,
          suggestion: 'This price should attract buyers while being fair.'
        };
      }
    } else {
      const suggestedPrice = Math.round(marketPrice * 0.9 * 100) / 100; // 10% below market
      return {
        type: 'warning',
        message: `Your price of ₹${userPrice} is above the average market price of ₹${marketPrice.toFixed(2)}.`,
        suggestion: `Consider lowering your price to around ₹${suggestedPrice} to attract more buyers. Remember, BookHive is for affordable books!`
      };
    }
  }

  /**
   * Get price guidelines for the platform
   */
  getPriceGuidelines() {
    return {
      maxPriceMultiplier: 1.1, // Max 110% of market price
      recommendedDiscount: 0.1, // Recommend 10% below market
      categories: {
        textbooks: {
          maxAge: 3, // years
          maxPrice: 200,
          recommendedDiscount: 0.3 // 30% off for textbooks
        },
        fiction: {
          maxPrice: 25,
          recommendedDiscount: 0.2 // 20% off for fiction
        },
        nonfiction: {
          maxPrice: 40,
          recommendedDiscount: 0.15 // 15% off for non-fiction
        },
        children: {
          maxPrice: 15,
          recommendedDiscount: 0.25 // 25% off for children's books
        }
      },
      conditions: {
        'New': 1.0, // Full price
        'Like New': 0.9, // 10% off
        'Very Good': 0.8, // 20% off
        'Good': 0.7, // 30% off
        'Fair': 0.5, // 50% off
        'Poor': 0.3 // 70% off
      }
    };
  }

  /**
   * Calculate recommended price based on condition and category
   */
  calculateRecommendedPrice(marketPrice, condition, category) {
    const guidelines = this.getPriceGuidelines();
    
    let recommendedPrice = marketPrice;
    
    // Apply condition discount
    if (guidelines.conditions[condition]) {
      recommendedPrice *= guidelines.conditions[condition];
    }
    
    // Apply category-specific discount
    if (guidelines.categories[category?.toLowerCase()]) {
      const categoryDiscount = guidelines.categories[category.toLowerCase()].recommendedDiscount;
      recommendedPrice *= (1 - categoryDiscount);
    } else {
      // Default discount for platform
      recommendedPrice *= (1 - guidelines.recommendedDiscount);
    }
    
    return Math.round(recommendedPrice * 100) / 100;
  }
}

export default PriceValidationService;