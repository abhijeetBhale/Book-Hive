import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, DollarSign, Star, MapPin, Eye, Heart } from 'lucide-react';
import BookCard from './BookCard';

const BooksForSale = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBooksForSale();
  }, [filters, pagination.page]);

  const fetchBooksForSale = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`/api/books/for-sale?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch books for sale');
      }

      const data = await response.json();
      setBooks(data.books);
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading books for sale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="w-8 h-8 mr-3 text-green-600" />
                Books for Sale
              </h1>
              <p className="text-gray-600 mt-2">
                Discover affordable books from our community members
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{pagination.total}</p>
              <p className="text-sm text-gray-500">books available</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books by title, author..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Biography">Biography</option>
                <option value="Children">Children</option>
                <option value="Textbook">Textbook</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="sellingPrice-asc">Price: Low to High</option>
                <option value="sellingPrice-desc">Price: High to Low</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Books Grid */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <BookForSaleCard key={book._id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books for Sale Found</h3>
            <p className="text-gray-600">
              {filters.search || filters.category || filters.minPrice || filters.maxPrice
                ? 'Try adjusting your search filters.'
                : 'Be the first to list a book for sale!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Book Card Component for Sale
const BookForSaleCard = ({ book }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleContact = () => {
    // Navigate to messaging or show contact modal
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // Add to wishlist logic
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100">
      {/* Book Cover */}
      <div className="relative h-48 bg-gradient-to-br from-green-100 to-blue-100">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ShoppingCart className="w-12 h-12 text-green-600" />
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-lg font-semibold">
          ₹{book.sellingPrice?.toFixed(2)}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Book Details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
        
        {/* Category and Condition */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {book.category}
          </span>
          <span className="text-xs text-gray-500">
            Condition: {book.condition}
          </span>
        </div>

        {/* Price Validation Status */}
        {book.priceValidation?.priceComparison?.isReasonable && (
          <div className="flex items-center mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-green-600 font-medium">Great Price!</span>
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">{book.owner?.name}</span>
          </div>
          {book.owner?.location && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              <span>Nearby</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleContact}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Contact Seller
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BooksForSale;