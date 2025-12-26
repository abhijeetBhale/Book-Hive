import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, MapPin, Star, Trash2, Search, Filter } from 'lucide-react';
import { usersAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import WishlistButton from '../components/books/WishlistButton';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('addedAt');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortWishlist();
  }, [wishlist, searchTerm, filterBy, sortBy]);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const data = await usersAPI.getWishlist({ page: 1, limit: 50 });
      setWishlist(data.wishlist || []);
      setPagination({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0
      });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortWishlist = () => {
    let filtered = [...wishlist];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply availability filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(book => {
        if (filterBy === 'available') return book.isAvailable;
        if (filterBy === 'unavailable') return !book.isAvailable;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'addedAt':
        default:
          return new Date(b.addedAt || b.createdAt) - new Date(a.addedAt || a.createdAt);
      }
    });

    setFilteredWishlist(filtered);
  };

  const handleWishlistChange = (bookId, isInWishlist) => {
    if (!isInWishlist) {
      // Remove from local state
      setWishlist(prev => prev.filter(book => book._id !== bookId));
      toast.success('Book removed from wishlist');
    }
  };

  const clearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        // Remove all books from wishlist
        const promises = wishlist.map(book => usersAPI.removeFromWishlist(book._id));
        await Promise.all(promises);
        setWishlist([]);
        toast.success('Wishlist cleared successfully');
      } catch (error) {
        console.error('Error clearing wishlist:', error);
        toast.error('Failed to clear wishlist');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">
                {pagination.total} book{pagination.total !== 1 ? 's' : ''} in your wishlist
              </p>
            </div>
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Start adding books you'd like to read to your wishlist!
            </p>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Browse Books
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search wishlist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Books</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Not Available</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="addedAt">Recently Added</option>
                  <option value="title">Title A-Z</option>
                  <option value="author">Author A-Z</option>
                  <option value="category">Category</option>
                </select>

                <div className="text-sm text-gray-600 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Showing {filteredWishlist.length} of {wishlist.length} books
                </div>
              </div>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWishlist.map((book) => (
                <div key={book._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="relative">
                    <Link to={`/books/${book._id}`}>
                      <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-16 h-16 text-blue-600" />
                        )}
                      </div>
                    </Link>
                    
                    {/* Availability Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                      book.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.isAvailable ? 'Available' : 'Not Available'}
                    </div>

                    {/* Wishlist Button */}
                    <div className="absolute top-2 right-2">
                      <WishlistButton
                        bookId={book._id}
                        isInWishlist={true}
                        onWishlistChange={handleWishlistChange}
                        size="md"
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    <Link to={`/books/${book._id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {book.category}
                      </span>
                      {book.condition && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {book.condition}
                        </span>
                      )}
                    </div>

                    {/* Owner Info */}
                    {book.owner && (
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/users/${book.owner._id}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {book.owner.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <span>{book.owner.name}</span>
                        </Link>

                        {book.owner.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>Nearby</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-4">
                      <Link
                        to={`/books/${book._id}`}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center block ${
                          book.isAvailable
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {book.isAvailable ? 'View Details' : 'Currently Unavailable'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty Filtered Results */}
            {filteredWishlist.length === 0 && wishlist.length > 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;