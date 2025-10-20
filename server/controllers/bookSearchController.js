import BookApiService from '../services/bookApiService.js';

const bookApiService = new BookApiService();

// @desc    Search books from multiple APIs
// @route   GET /api/books/search
export const searchBooksFromAPIs = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Query must be at least 2 characters long' 
      });
    }

    console.log(`Searching for books: "${query}"`);
    
    const books = await bookApiService.searchBooks(query, parseInt(limit));
    
    res.json({
      success: true,
      query,
      count: books.length,
      books
    });
  } catch (error) {
    console.error('Book search error:', error);
    res.status(500).json({ 
      message: 'Error searching books',
      error: error.message 
    });
  }
};

// @desc    Search book by ISBN from multiple APIs
// @route   GET /api/books/search/isbn/:isbn
export const searchBookByISBN = async (req, res) => {
  try {
    const { isbn } = req.params;
    
    if (!isbn) {
      return res.status(400).json({ message: 'ISBN is required' });
    }

    console.log(`Searching for book by ISBN: ${isbn}`);
    
    const book = await bookApiService.searchByISBN(isbn);
    
    if (!book) {
      return res.status(404).json({ 
        message: 'Book not found',
        isbn 
      });
    }

    res.json({
      success: true,
      isbn,
      book
    });
  } catch (error) {
    console.error('ISBN search error:', error);
    res.status(500).json({ 
      message: 'Error searching book by ISBN',
      error: error.message 
    });
  }
};

// @desc    Get multiple cover options for a book
// @route   POST /api/books/covers
export const getBookCovers = async (req, res) => {
  try {
    const { title, author, isbn } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({ 
        message: 'Title and author are required' 
      });
    }

    console.log(`Getting covers for: "${title}" by ${author}`);
    
    const covers = await bookApiService.getMultipleCoverOptions(title, author, isbn);
    
    // Validate cover URLs
    const validatedCovers = await Promise.all(
      covers.map(async (cover) => {
        const validation = await bookApiService.validateImageUrl(cover.url);
        return {
          ...cover,
          validation
        };
      })
    );

    // Filter out invalid covers and sort by quality
    const validCovers = validatedCovers
      .filter(cover => cover.validation.valid && cover.validation.isImage)
      .sort((a, b) => {
        // Prioritize high quality images
        if (a.validation.isHighQuality && !b.validation.isHighQuality) return -1;
        if (!a.validation.isHighQuality && b.validation.isHighQuality) return 1;
        
        // Then by file size (larger is usually better quality)
        return (b.validation.size || 0) - (a.validation.size || 0);
      });

    res.json({
      success: true,
      title,
      author,
      isbn,
      count: validCovers.length,
      covers: validCovers
    });
  } catch (error) {
    console.error('Get covers error:', error);
    res.status(500).json({ 
      message: 'Error getting book covers',
      error: error.message 
    });
  }
};

// @desc    Validate and optimize image URL
// @route   POST /api/books/validate-image
export const validateImageUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const validation = await bookApiService.validateImageUrl(url);
    
    res.json({
      success: true,
      url,
      validation
    });
  } catch (error) {
    console.error('Image validation error:', error);
    res.status(500).json({ 
      message: 'Error validating image',
      error: error.message 
    });
  }
};

// @desc    Get book details from external API
// @route   GET /api/books/external/:source/:id
export const getExternalBookDetails = async (req, res) => {
  try {
    const { source, id } = req.params;
    
    let book = null;
    
    switch (source) {
      case 'google':
        try {
          const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
          const data = await response.json();
          
          if (data.volumeInfo) {
            book = {
              source: 'google',
              id: data.id,
              title: data.volumeInfo.title || 'Unknown Title',
              authors: data.volumeInfo.authors || ['Unknown Author'],
              author: (data.volumeInfo.authors || ['Unknown Author']).join(', '),
              description: data.volumeInfo.description || 'No description available',
              isbn: bookApiService.extractISBN(data.volumeInfo.industryIdentifiers),
              publishedDate: data.volumeInfo.publishedDate,
              publicationYear: data.volumeInfo.publishedDate ? 
                parseInt(data.volumeInfo.publishedDate.split('-')[0]) : null,
              pageCount: data.volumeInfo.pageCount,
              categories: data.volumeInfo.categories || [],
              category: (data.volumeInfo.categories || ['General'])[0],
              language: data.volumeInfo.language || 'en',
              publisher: data.volumeInfo.publisher,
              images: bookApiService.getGoogleBooksImages(data.volumeInfo.imageLinks),
              coverImage: bookApiService.getBestGoogleBooksCover(data.volumeInfo.imageLinks),
              rating: data.volumeInfo.averageRating,
              ratingsCount: data.volumeInfo.ratingsCount,
              previewLink: data.volumeInfo.previewLink,
              infoLink: data.volumeInfo.infoLink,
            };
          }
        } catch (error) {
          console.error('Error fetching Google Books details:', error);
        }
        break;
        
      case 'openlibrary':
        try {
          const response = await fetch(`https://openlibrary.org${id}.json`);
          const data = await response.json();
          
          if (data) {
            book = {
              source: 'openlibrary',
              id: data.key,
              title: data.title || 'Unknown Title',
              authors: data.authors ? data.authors.map(a => a.name || 'Unknown Author') : ['Unknown Author'],
              author: data.authors ? data.authors.map(a => a.name || 'Unknown Author').join(', ') : 'Unknown Author',
              description: data.description?.value || data.description || 'No description available',
              isbn: data.isbn_13 ? data.isbn_13[0] : (data.isbn_10 ? data.isbn_10[0] : null),
              publishedDate: data.publish_date,
              publicationYear: data.publish_date ? parseInt(data.publish_date.split(' ').pop()) : null,
              pageCount: data.number_of_pages,
              categories: data.subjects || [],
              category: (data.subjects || ['General'])[0],
              language: data.languages ? data.languages[0].key.replace('/languages/', '') : 'en',
              publisher: data.publishers ? data.publishers[0] : null,
              images: bookApiService.getOpenLibraryImagesFromBook(data),
              coverImage: bookApiService.getBestOpenLibraryCoverFromISBN(data.isbn_13?.[0] || data.isbn_10?.[0]),
              previewLink: `https://openlibrary.org${data.key}`,
              infoLink: `https://openlibrary.org${data.key}`,
            };
          }
        } catch (error) {
          console.error('Error fetching Open Library details:', error);
        }
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid source' });
    }
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({
      success: true,
      source,
      id,
      book
    });
  } catch (error) {
    console.error('Get external book details error:', error);
    res.status(500).json({ 
      message: 'Error getting book details',
      error: error.message 
    });
  }
};