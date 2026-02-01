import React, { useState, useEffect, useContext } from 'react';
import { booksAPI } from '../utils/api';
import BookCard from '../components/books/BookCard';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Books = () => {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    condition: '',
    language: '',
    genre: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    isAvailable: '',
    bookType: 'borrowing',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    useLocation: false,
    maxDistance: 10,
    page: 1,
    limit: 20
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (activeTab === 'recommendations' && user) {
        response = await booksAPI.getRecommendations({ limit: 20 });
        setBooks(response.recommendations || []);
        setPagination({ total: response.count || 0, page: 1, pages: 1 });
      } else {
        // Apply location if user is logged in and useLocation is enabled
        const searchParams = { ...filters };
        if (user && filters.useLocation && user.location?.coordinates) {
          searchParams.latitude = user.location.coordinates[1];
          searchParams.longitude = user.location.coordinates[0];
          searchParams.maxDistance = filters.maxDistance * 1000; // Convert km to meters
        }

        console.log('Fetching books with params:', searchParams);
        response = await booksAPI.getAll(searchParams);
        
        // Handle different response structures
        const responseData = response.data || response;
        const fetchedBooks = responseData.books || [];
        const paginationData = responseData.pagination || {};
        
        setBooks(fetchedBooks);
        setPagination(paginationData);
      }
      
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again later.');
      setBooks([]);
      setPagination({});
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [filters, activeTab]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      category: '',
      author: '',
      condition: '',
      language: '',
      genre: '',
      minYear: '',
      maxYear: '',
      minPrice: '',
      maxPrice: '',
      isAvailable: '',
      bookType: 'borrowing',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      useLocation: false,
      maxDistance: 10,
      page: 1,
      limit: 20
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchBooks}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-100 to-purple-100 py-12">
        <div className="max-width-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Books
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse thousands of books available for borrowing and purchase in your community
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg shadow-sm border p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Books
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'recommendations'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Recommendations
              </button>
            )}
          </div>
        </div>

        {/* Simple Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                placeholder="Search books..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Biography">Biography</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Self-Help">Self-Help</option>
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange({ condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="worn">Worn</option>
              </select>
            </div>

            {/* Book Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.bookType}
                onChange={(e) => handleFilterChange({ bookType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="borrowing">For Borrowing</option>
                <option value="selling">For Sale</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  handleFilterChange({ sortBy, sortOrder });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
                <option value="author_asc">Author A-Z</option>
                <option value="viewCount_desc">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All Filters
            </button>
            <p className="text-sm text-gray-600">
              {pagination.total || 0} books found
            </p>
          </div>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No books found</p>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Books;