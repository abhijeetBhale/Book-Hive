import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Star, 
  Eye, 
  ArrowRight, 
  RefreshCw, 
  Filter,
  MoreHorizontal,
  TrendingUp,
  Award
} from 'lucide-react';
import { adminAPIService } from '../../utils/adminAPI';

const TopBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('borrowCount');

  useEffect(() => {
    fetchTopBooks();
  }, []);

  const fetchTopBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPIService.getDashboard();
      setBooks(response.data.data.topBooks || []);
    } catch (error) {
      console.error('Error fetching top books:', error);
      setError('Failed to load top books');
    } finally {
      setLoading(false);
    }
  };

  const sortBooks = (books, criteria) => {
    return [...books].sort((a, b) => {
      switch (criteria) {
        case 'borrowCount':
          return (b.borrowCount || 0) - (a.borrowCount || 0);
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'viewCount':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return 0;
      }
    });
  };

  const sortedBooks = sortBooks(books, sortBy);
  const displayBooks = sortedBooks.slice(0, 8);

  const getStatusColor = (isAvailable) => {
    return isAvailable 
      ? 'bg-green-100 text-green-600' 
      : 'bg-red-100 text-red-600';
  };

  const getStatusText = (isAvailable) => {
    return isAvailable ? 'Available' : 'Borrowed';
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Award className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Award className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Award className="w-4 h-4 text-orange-500" />;
    return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Books</h3>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
              <div className="w-12 h-16 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Books</h3>
          <p className="text-sm text-gray-500">Most popular books on the platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="borrowCount">Most Borrowed</option>
            <option value="rating">Highest Rated</option>
            <option value="viewCount">Most Viewed</option>
          </select>
          <button 
            onClick={fetchTopBooks}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchTopBooks}
              className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      ) : books.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No books available yet</p>
            <p className="text-sm text-gray-400">Books will appear as users add them to the platform</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Books - Featured Display */}
          {displayBooks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {displayBooks.slice(0, 3).map((book, index) => (
                <div key={book._id} className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                  <div className="absolute top-2 right-2">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      {book.coverImage ? (
                        <img 
                          src={book.coverImage} 
                          alt={book.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{book.title}</h4>
                      <p className="text-xs text-gray-600 truncate">{book.author}</p>
                      <p className="text-xs text-gray-500">{book.category}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <ArrowRight className="w-3 h-3 text-blue-500" />
                            <span className="text-blue-600 font-medium">{book.borrowCount || 0}</span>
                          </div>
                          {book.rating?.average > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-gray-600">{book.rating.average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(book.isAvailable)}`}>
                          {getStatusText(book.isAvailable)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Books Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Rank</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Book</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Borrows</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Rating</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Views</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayBooks.map((book, index) => (
                  <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          {book.coverImage ? (
                            <img 
                              src={book.coverImage} 
                              alt={book.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <BookOpen className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                          <p className="text-xs text-gray-500 truncate">{book.author}</p>
                          <p className="text-xs text-gray-400">{book.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1">
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">{book.borrowCount || 0}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {book.rating?.average > 0 ? (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm text-gray-600">{book.rating.average.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({book.rating.count || 0})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No ratings</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{book.viewCount || 0}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(book.isAvailable)}`}>
                        {getStatusText(book.isAvailable)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{books.length}</div>
                <div className="text-xs text-gray-500">Total Books</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {books.reduce((sum, book) => sum + (book.borrowCount || 0), 0)}
                </div>
                <div className="text-xs text-gray-500">Total Borrows</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {books.filter(book => book.rating?.average > 0).length > 0 
                    ? (books.reduce((sum, book) => sum + (book.rating?.average || 0), 0) / 
                       books.filter(book => book.rating?.average > 0).length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-xs text-gray-500">Avg Rating</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {books.filter(book => book.isAvailable).length}
                </div>
                <div className="text-xs text-gray-500">Available</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopBooks;