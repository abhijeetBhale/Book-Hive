import axios from 'axios';

class BookApiService {
  constructor() {
    this.apis = {
      googleBooks: 'https://www.googleapis.com/books/v1/volumes',
      openLibrary: 'https://openlibrary.org',
      bookCover: 'https://covers.openlibrary.org/b',
      isbnDb: 'https://api.isbndb.com/book',
      // Add more APIs as needed
    };
    
    // You can add API keys here if needed
    this.apiKeys = {
      isbnDb: process.env.ISBNDB_API_KEY, // Optional: Get from isbndb.com
      googleBooks: process.env.GOOGLE_BOOKS_API_KEY, // Optional: Get from Google Cloud Console
    };
  }

  // Search books from multiple sources
  async searchBooks(query, limit = 10) {
    const results = await Promise.allSettled([
      this.searchGoogleBooks(query, limit),
      this.searchOpenLibrary(query, limit),
    ]);

    const allBooks = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allBooks.push(...result.value);
      }
    });

    // Remove duplicates based on ISBN or title+author
    const uniqueBooks = this.removeDuplicates(allBooks);
    return uniqueBooks.slice(0, limit);
  }

  // Google Books API
  async searchGoogleBooks(query, limit = 10) {
    try {
      const apiKey = this.apiKeys.googleBooks ? `&key=${this.apiKeys.googleBooks}` : '';
      const response = await axios.get(
        `${this.apis.googleBooks}?q=${encodeURIComponent(query)}&maxResults=${limit}${apiKey}`
      );

      if (!response.data.items) return [];

      return response.data.items.map(item => ({
        source: 'google',
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        authors: item.volumeInfo.authors || ['Unknown Author'],
        author: (item.volumeInfo.authors || ['Unknown Author']).join(', '),
        description: item.volumeInfo.description || 'No description available',
        isbn: this.extractISBN(item.volumeInfo.industryIdentifiers),
        publishedDate: item.volumeInfo.publishedDate,
        publicationYear: item.volumeInfo.publishedDate ? 
          parseInt(item.volumeInfo.publishedDate.split('-')[0]) : null,
        pageCount: item.volumeInfo.pageCount,
        categories: item.volumeInfo.categories || [],
        category: (item.volumeInfo.categories || ['General'])[0],
        language: item.volumeInfo.language || 'en',
        publisher: item.volumeInfo.publisher,
        images: this.getGoogleBooksImages(item.volumeInfo.imageLinks),
        coverImage: this.getBestGoogleBooksCover(item.volumeInfo.imageLinks),
        rating: item.volumeInfo.averageRating,
        ratingsCount: item.volumeInfo.ratingsCount,
        previewLink: item.volumeInfo.previewLink,
        infoLink: item.volumeInfo.infoLink,
      }));
    } catch (error) {
      console.error('Google Books API error:', error);
      return [];
    }
  }

  // Open Library API
  async searchOpenLibrary(query, limit = 10) {
    try {
      const response = await axios.get(
        `${this.apis.openLibrary}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.data.docs) return [];

      return response.data.docs.map(doc => ({
        source: 'openlibrary',
        id: doc.key,
        title: doc.title || 'Unknown Title',
        authors: doc.author_name || ['Unknown Author'],
        author: (doc.author_name || ['Unknown Author']).join(', '),
        description: doc.first_sentence ? doc.first_sentence.join(' ') : 'No description available',
        isbn: doc.isbn ? doc.isbn[0] : null,
        publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : null,
        publicationYear: doc.first_publish_year,
        pageCount: doc.number_of_pages_median,
        categories: doc.subject || [],
        category: (doc.subject || ['General'])[0],
        language: doc.language ? doc.language[0] : 'en',
        publisher: doc.publisher ? doc.publisher[0] : null,
        images: this.getOpenLibraryImages(doc),
        coverImage: this.getBestOpenLibraryCover(doc),
        rating: null,
        ratingsCount: null,
        previewLink: `https://openlibrary.org${doc.key}`,
        infoLink: `https://openlibrary.org${doc.key}`,
      }));
    } catch (error) {
      console.error('Open Library API error:', error);
      return [];
    }
  }

  // Search by ISBN from multiple sources
  async searchByISBN(isbn) {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    const results = await Promise.allSettled([
      this.getGoogleBooksByISBN(cleanISBN),
      this.getOpenLibraryByISBN(cleanISBN),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }

    return null;
  }

  async getGoogleBooksByISBN(isbn) {
    try {
      const apiKey = this.apiKeys.googleBooks ? `&key=${this.apiKeys.googleBooks}` : '';
      const response = await axios.get(
        `${this.apis.googleBooks}?q=isbn:${isbn}${apiKey}`
      );

      if (!response.data.items || response.data.items.length === 0) return null;

      const item = response.data.items[0];
      return {
        source: 'google',
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        authors: item.volumeInfo.authors || ['Unknown Author'],
        author: (item.volumeInfo.authors || ['Unknown Author']).join(', '),
        description: item.volumeInfo.description || 'No description available',
        isbn: this.extractISBN(item.volumeInfo.industryIdentifiers),
        publishedDate: item.volumeInfo.publishedDate,
        publicationYear: item.volumeInfo.publishedDate ? 
          parseInt(item.volumeInfo.publishedDate.split('-')[0]) : null,
        pageCount: item.volumeInfo.pageCount,
        categories: item.volumeInfo.categories || [],
        category: (item.volumeInfo.categories || ['General'])[0],
        language: item.volumeInfo.language || 'en',
        publisher: item.volumeInfo.publisher,
        images: this.getGoogleBooksImages(item.volumeInfo.imageLinks),
        coverImage: this.getBestGoogleBooksCover(item.volumeInfo.imageLinks),
        rating: item.volumeInfo.averageRating,
        ratingsCount: item.volumeInfo.ratingsCount,
        previewLink: item.volumeInfo.previewLink,
        infoLink: item.volumeInfo.infoLink,
      };
    } catch (error) {
      console.error('Google Books ISBN search error:', error);
      return null;
    }
  }

  async getOpenLibraryByISBN(isbn) {
    try {
      const response = await axios.get(
        `${this.apis.openLibrary}/isbn/${isbn}.json`
      );

      const book = response.data;
      if (!book) return null;

      // Get additional details
      let workDetails = null;
      if (book.works && book.works[0]) {
        try {
          const workResponse = await axios.get(
            `${this.apis.openLibrary}${book.works[0].key}.json`
          );
          workDetails = workResponse.data;
        } catch (e) {
          console.log('Could not fetch work details');
        }
      }

      return {
        source: 'openlibrary',
        id: book.key,
        title: book.title || 'Unknown Title',
        authors: book.authors ? book.authors.map(a => a.name || 'Unknown Author') : ['Unknown Author'],
        author: book.authors ? book.authors.map(a => a.name || 'Unknown Author').join(', ') : 'Unknown Author',
        description: workDetails?.description?.value || workDetails?.description || 'No description available',
        isbn: isbn,
        publishedDate: book.publish_date,
        publicationYear: book.publish_date ? parseInt(book.publish_date.split(' ').pop()) : null,
        pageCount: book.number_of_pages,
        categories: book.subjects || [],
        category: (book.subjects || ['General'])[0],
        language: book.languages ? book.languages[0].key.replace('/languages/', '') : 'en',
        publisher: book.publishers ? book.publishers[0] : null,
        images: this.getOpenLibraryImagesFromBook(book),
        coverImage: this.getBestOpenLibraryCoverFromISBN(isbn),
        rating: null,
        ratingsCount: null,
        previewLink: `https://openlibrary.org${book.key}`,
        infoLink: `https://openlibrary.org${book.key}`,
      };
    } catch (error) {
      console.error('Open Library ISBN search error:', error);
      return null;
    }
  }

  // Image processing methods
  getGoogleBooksImages(imageLinks) {
    if (!imageLinks) return {};
    
    return {
      thumbnail: imageLinks.thumbnail?.replace('http:', 'https:'),
      small: imageLinks.small?.replace('http:', 'https:'),
      medium: imageLinks.medium?.replace('http:', 'https:'),
      large: imageLinks.large?.replace('http:', 'https:'),
      extraLarge: imageLinks.extraLarge?.replace('http:', 'https:'),
    };
  }

  getBestGoogleBooksCover(imageLinks) {
    if (!imageLinks) return null;
    
    // Priority: extraLarge > large > medium > small > thumbnail
    const sizes = ['extraLarge', 'large', 'medium', 'small', 'thumbnail'];
    
    for (const size of sizes) {
      if (imageLinks[size]) {
        // Enhance image quality by modifying URL parameters
        let url = imageLinks[size].replace('http:', 'https:');
        
        // For Google Books, we can modify the URL to get higher quality
        if (url.includes('books.google.com')) {
          // Remove zoom and size restrictions, add high quality parameters
          url = url.replace(/&zoom=\d+/, '&zoom=1');
          url = url.replace(/&w=\d+/, '');
          url = url.replace(/&h=\d+/, '');
          url += '&fife=w800-h1200'; // Request high resolution
        }
        
        return url;
      }
    }
    
    return null;
  }

  getOpenLibraryImages(doc) {
    const images = {};
    
    if (doc.cover_i) {
      const coverId = doc.cover_i;
      images.thumbnail = `${this.apis.bookCover}/id/${coverId}-S.jpg`;
      images.small = `${this.apis.bookCover}/id/${coverId}-M.jpg`;
      images.medium = `${this.apis.bookCover}/id/${coverId}-L.jpg`;
      images.large = `${this.apis.bookCover}/id/${coverId}-L.jpg`;
    }
    
    if (doc.isbn && doc.isbn[0]) {
      const isbn = doc.isbn[0];
      images.isbnSmall = `${this.apis.bookCover}/isbn/${isbn}-S.jpg`;
      images.isbnMedium = `${this.apis.bookCover}/isbn/${isbn}-M.jpg`;
      images.isbnLarge = `${this.apis.bookCover}/isbn/${isbn}-L.jpg`;
    }
    
    return images;
  }

  getBestOpenLibraryCover(doc) {
    if (doc.cover_i) {
      return `${this.apis.bookCover}/id/${doc.cover_i}-L.jpg`;
    }
    
    if (doc.isbn && doc.isbn[0]) {
      return `${this.apis.bookCover}/isbn/${doc.isbn[0]}-L.jpg`;
    }
    
    return null;
  }

  getOpenLibraryImagesFromBook(book) {
    const images = {};
    
    if (book.covers && book.covers[0]) {
      const coverId = book.covers[0];
      images.thumbnail = `${this.apis.bookCover}/id/${coverId}-S.jpg`;
      images.small = `${this.apis.bookCover}/id/${coverId}-M.jpg`;
      images.medium = `${this.apis.bookCover}/id/${coverId}-L.jpg`;
      images.large = `${this.apis.bookCover}/id/${coverId}-L.jpg`;
    }
    
    return images;
  }

  getBestOpenLibraryCoverFromISBN(isbn) {
    return `${this.apis.bookCover}/isbn/${isbn}-L.jpg`;
  }

  // Utility methods
  extractISBN(identifiers) {
    if (!identifiers) return null;
    
    // Prefer ISBN_13 over ISBN_10
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;
    
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;
    
    return identifiers[0]?.identifier || null;
  }

  removeDuplicates(books) {
    const seen = new Set();
    const uniqueBooks = [];
    
    for (const book of books) {
      // Create a unique key based on ISBN, or title+author
      const key = book.isbn || `${book.title.toLowerCase()}-${book.author.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBooks.push(book);
      }
    }
    
    return uniqueBooks;
  }

  // Get multiple cover image options for a book
  async getMultipleCoverOptions(title, author, isbn = null) {
    const covers = [];
    
    // Google Books search
    try {
      const query = isbn ? `isbn:${isbn}` : `${title} ${author}`;
      const googleBooks = await this.searchGoogleBooks(query, 3);
      googleBooks.forEach(book => {
        if (book.coverImage) {
          covers.push({
            source: 'google',
            url: book.coverImage,
            quality: 'high',
            title: book.title,
            author: book.author
          });
        }
      });
    } catch (error) {
      console.error('Error getting Google Books covers:', error);
    }
    
    // Open Library covers
    if (isbn) {
      covers.push({
        source: 'openlibrary',
        url: `${this.apis.bookCover}/isbn/${isbn}-L.jpg`,
        quality: 'high',
        title,
        author
      });
    }
    
    // Search Open Library by title/author
    try {
      const openLibraryBooks = await this.searchOpenLibrary(`${title} ${author}`, 3);
      openLibraryBooks.forEach(book => {
        if (book.coverImage) {
          covers.push({
            source: 'openlibrary',
            url: book.coverImage,
            quality: 'medium',
            title: book.title,
            author: book.author
          });
        }
      });
    } catch (error) {
      console.error('Error getting Open Library covers:', error);
    }
    
    return covers;
  }

  // Validate if an image URL is accessible and high quality
  async validateImageUrl(url) {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      const contentType = response.headers['content-type'];
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      return {
        valid: response.status === 200,
        contentType,
        size: contentLength,
        isImage: contentType && contentType.startsWith('image/'),
        isHighQuality: contentLength > 10000 // Assume images > 10KB are better quality
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

export default BookApiService;