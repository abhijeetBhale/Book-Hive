import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, Check, X, ArrowRight, Inbox, CheckCircle, Eye, Trash2, BookOpen, User, MessageSquare, Shield, Wallet, Heart, Search, Filter, MapPin, Star } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageHelpers';
import toast from 'react-hot-toast';
import { borrowAPI, reviewsAPI, usersAPI } from '../utils/api';
import { formatDate } from '../utils/dateHelpers';
import ReviewModal from '../components/ReviewModal';
import DepositPaymentModal from '../components/borrow/DepositPaymentModal';
import LendingFeePaymentModal from '../components/borrow/LendingFeePaymentModal';
import WishlistButton from '../components/books/WishlistButton';
import { Link } from 'react-router-dom';

const BorrowRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [bookHistory, setBookHistory] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [editingBook, setEditingBook] = useState(null);

  // Wishlist filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('addedAt');
  const [wishlistPagination, setWishlistPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  const [reviewModal, setReviewModal] = useState({ open: false, borrowRequestId: null, toUserId: null, counterpartName: '' });
  const [reviewedRequests, setReviewedRequests] = useState(new Set());
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, requestId: null, bookTitle: null });
  const [depositModal, setDepositModal] = useState({ open: false, borrowRequest: null });
  const [lendingFeeModal, setLendingFeeModal] = useState({ open: false, borrowRequest: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [receivedRes, myRes, historyRes, wishlistRes] = await Promise.all([
        borrowAPI.getReceivedRequests(),
        borrowAPI.getMyRequests(),
        borrowAPI.getBookHistory(),
        usersAPI.getWishlist({ page: 1, limit: 50 }),
      ]);

      // Filter out any requests with missing critical data
      const validReceivedRequests = (receivedRes.data.requests || []).filter(req =>
        req && req._id && req.book && req.borrower
      );
      const validMyRequests = (myRes.data.requests || []).filter(req =>
        req && req._id && req.book && req.owner
      );

      setReceivedRequests(validReceivedRequests);
      setMyRequests(validMyRequests);
      setBookHistory(historyRes.data.history || []);
      setWishlist(wishlistRes.wishlist || []);
      setWishlistPagination({
        page: wishlistRes.page || 1,
        pages: wishlistRes.pages || 1,
        total: wishlistRes.total || 0
      });

    } catch (error) {
      toast.error('Failed to fetch borrow requests.');
      // Set empty arrays on error
      setReceivedRequests([]);
      setMyRequests([]);
      setBookHistory([]);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort wishlist when dependencies change
  useEffect(() => {
    filterAndSortWishlist();
  }, [wishlist, searchTerm, filterBy, sortBy]);

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

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await borrowAPI.updateRequest(requestId, status);
      toast.success(`Request ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update request status.');
    }
  };

  const handleMarkAsBorrowed = async (requestId) => {
    try {
      await borrowAPI.markAsBorrowed(requestId);
      toast.success('Book marked as borrowed! The borrower can now return it when done.');
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark book as borrowed';
      console.error('Mark as borrowed error:', error.response?.data);
      toast.error(errorMessage);
    }
  };

  const handleMarkAsReturned = async (requestId) => {
    try {
      await borrowAPI.markAsReturned(requestId);
      toast.success('Book returned successfully! You can now leave a review.');
      fetchData();
    } catch (error) {
      toast.error('Failed to mark book as returned');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await borrowAPI.deleteRequest(requestId);
      toast.success('Request deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const handleMakeAvailableAgain = async (bookId, requestId) => {
    if (!editingBook) {
      // Just open the edit modal
      const book = receivedRequests.find(req => req.book._id === bookId)?.book;
      if (book) {
        setEditingBook({
          id: bookId,
          requestId: requestId,
          lendingDuration: book.lendingDuration || 14,
          securityDeposit: book.securityDeposit || 0
        });
      }
      return;
    }

    try {
      // Import booksAPI
      const { booksAPI } = await import('../utils/api');
      
      await booksAPI.update(bookId, {
        isAvailable: true,
        forBorrowing: true,
        lendingDuration: editingBook.lendingDuration,
        securityDeposit: editingBook.securityDeposit
      });

      // Delete the borrow request to remove it from the returned tab
      await borrowAPI.deleteRequest(editingBook.requestId);
      
      toast.success('Book is now available for borrowing again!');
      setEditingBook(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to make book available');
    }
  };

  const renderStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: '#fffbeb', text: '#b45309' },
      approved: { bg: '#eff6ff', text: '#2563eb' },
      borrowed: { bg: '#f0fdf4', text: '#16a34a' },
      denied: { bg: '#fef2f2', text: '#dc2626' },
      returned: { bg: '#f8fafc', text: '#475569' },
    };
    const style = statusStyles[status] || statusStyles.returned;
    return <span className="status-badge" style={{ backgroundColor: style.bg, color: style.text }}>{status}</span>;
  };

  const EmptyState = ({ message }) => (
    <div className="empty-state">
      <div className="empty-icon-wrapper">
        <Inbox size={48} />
      </div>
      <h3 className="empty-title">No Requests Found</h3>
      <p className="empty-message">{message}</p>
    </div>
  );

  const renderBookHistory = () => {
    if (bookHistory.length === 0) {
      return <EmptyState message="No book borrowing history yet. Your completed transactions will appear here." />;
    }

    return (
      <div className="requests-grid">
        {bookHistory.map(transaction => (
          <div key={transaction._id} className={`request-card history-card ${transaction.status === 'returned' ? 'completed-transaction' : 'denied-transaction'}`}>
            <div className="book-cover-container">
              <img
                src={getFullImageUrl(transaction.book?.coverImage)}
                alt={transaction.book?.title || 'Book cover'}
                className="book-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                }}
              />
              {transaction.status === 'returned' && (
                <div className="history-badge completed">
                  <CheckCircle size={16} />
                  Completed
                </div>
              )}
              {transaction.status === 'denied' && (
                <div className="history-badge denied">
                  <X size={16} />
                  Denied
                </div>
              )}
            </div>
            <div className="card-content">
              <div className="card-header">
                <h3 className="book-title">{transaction.book?.title || 'Unknown Book'}</h3>
                {renderStatusBadge(transaction.status)}
              </div>
              <div className={`role-indicator ${transaction.role === 'lender' ? 'lender-role' : 'borrower-role'}`}>
                {transaction.role === 'lender' ? <BookOpen size={16} /> : <User size={16} />}
                <span>You were the {transaction.role.toUpperCase()}</span>
              </div>
              <div className="user-info">
                <div className="user-label">
                  {transaction.role === 'lender' ? 'BORROWER:' : 'LENDER:'}
                </div>
                <img
                  src={transaction.role === 'lender' ? transaction.borrower?.avatar : transaction.owner?.avatar}
                  alt={transaction.role === 'lender' ? transaction.borrower?.name : transaction.owner?.name}
                  className="user-avatar"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                  }}
                />
                <p>
                  <strong>
                    {transaction.role === 'lender' ? transaction.borrower?.name : transaction.owner?.name}
                  </strong>
                </p>
              </div>
              <div className="transaction-timeline">
                <p className="timeline-item">
                  <span className="timeline-label">Requested:</span>
                  <span className="timeline-date">{formatDate(transaction.requestedAt)}</span>
                </p>
                {transaction.borrowedAt && (
                  <p className="timeline-item">
                    <span className="timeline-label">Borrowed:</span>
                    <span className="timeline-date">{formatDate(transaction.borrowedAt)}</span>
                  </p>
                )}
                {transaction.returnedAt && (
                  <p className="timeline-item">
                    <span className="timeline-label">Returned:</span>
                    <span className="timeline-date">{formatDate(transaction.returnedAt)}</span>
                  </p>
                )}
                <p className="timeline-item">
                  <span className="timeline-label">
                    {transaction.status === 'returned' ? 'Completed:' : 'Denied:'}
                  </span>
                  <span className="timeline-date">{formatDate(transaction.completedAt)}</span>
                </p>
              </div>
              {transaction.lendingDuration && transaction.status === 'returned' && (
                <div className="transaction-details">
                  <span className="detail-item">Duration: {transaction.lendingDuration} days</span>
                  {transaction.lendingFee > 0 && (
                    <span className="detail-item">Fee: ₹{transaction.lendingFee}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWishlist = () => {
    if (wishlist.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <Heart size={48} />
          </div>
          <h3 className="empty-title">Your wishlist is empty</h3>
          <p className="empty-message">
            Start adding books you'd like to read to your wishlist!
          </p>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
          >
            <BookOpen size={20} />
            Browse Books
          </Link>
        </div>
      );
    }

    return (
      <>
        {/* Wishlist Header */}
        <div className="wishlist-header">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
                <p className="text-gray-600">
                  {wishlistPagination.total} book{wishlistPagination.total !== 1 ? 's' : ''} in your wishlist
                </p>
              </div>
            </div>

            {wishlist.length > 0 && (
              <button
                onClick={clearWishlist}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            )}
          </div>

          {/* Filters and Search */}
          <div className="wishlist-filters">
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
        </div>

        {/* Wishlist Grid */}
        {filteredWishlist.length > 0 ? (
          <div className="wishlist-grid">
            {filteredWishlist.map((book) => (
              <div key={book._id} className="wishlist-card">
                <div className="wishlist-book-cover">
                  <Link to={`/books/${book._id}`}>
                    <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {book.coverImage ? (
                        <img
                          src={getFullImageUrl(book.coverImage)}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                          }}
                        />
                      ) : (
                        <BookOpen className="w-16 h-16 text-blue-600" />
                      )}
                    </div>
                  </Link>
                  
                  {/* Availability Badge */}
                  <div className={`availability-badge ${book.isAvailable ? 'available' : 'unavailable'}`}>
                    {book.isAvailable ? 'Available' : 'Not Available'}
                  </div>

                  {/* Wishlist Button */}
                  <div className="wishlist-button-container">
                    <WishlistButton
                      bookId={book._id}
                      isInWishlist={true}
                      onWishlistChange={handleWishlistChange}
                      size="md"
                    />
                  </div>
                </div>

                <div className="wishlist-card-content">
                  <Link to={`/books/${book._id}`}>
                    <h3 className="wishlist-book-title">
                      {book.title}
                    </h3>
                  </Link>
                  
                  <p className="wishlist-book-author">by {book.author}</p>
                  
                  <div className="wishlist-book-tags">
                    <span className="book-tag category-tag">
                      {book.category}
                    </span>
                    {book.condition && (
                      <span className="book-tag condition-tag">
                        {book.condition}
                      </span>
                    )}
                  </div>

                  {/* Owner Info */}
                  {book.owner && (
                    <div className="wishlist-owner-info">
                      <Link 
                        to={`/users/${book.owner._id}`}
                        className="owner-link"
                      >
                        <div className="owner-avatar">
                          <span className="owner-initial">
                            {book.owner.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="owner-name">{book.owner.name}</span>
                      </Link>

                      {book.owner.location && (
                        <div className="location-indicator">
                          <MapPin className="w-3 h-3" />
                          <span>Nearby</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="wishlist-action">
                    <Link
                      to={`/books/${book._id}`}
                      className={`wishlist-action-btn ${book.isAvailable ? 'available' : 'unavailable'}`}
                    >
                      {book.isAvailable ? 'View Details' : 'Currently Unavailable'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Search size={48} />
            </div>
            <h3 className="empty-title">No books found</h3>
            <p className="empty-message">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBy('all');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
            >
              Clear Filters
            </button>
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="loading-state"><Loader className="animate-spin" /></div>;
    }

    if (activeTab === 'received') {
      // Filter out denied and reviewed returned requests from main view
      const activeReceivedRequests = receivedRequests.filter(req => 
        req.book && 
        req.borrower && 
        req.status !== 'denied' && 
        !(req.status === 'returned' && reviewedRequests.has(req._id))
      );
      
      return activeReceivedRequests.length > 0 ? (
        <div className="requests-grid">
          {activeReceivedRequests.map(req => (
            <div key={req._id} className="request-card">
              <div className="book-cover-container">
                <img
                  src={getFullImageUrl(req.book?.coverImage)}
                  alt={req.book?.title || 'Book cover'}
                  className="book-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                  }}
                />
              </div>
              <div className="card-content">
                <div className="card-header">
                  <h3 className="book-title">{req.book?.title || 'Unknown Book'}</h3>
                  {renderStatusBadge(req.status)}
                </div>
                {req.book?.forBorrowing && req.book?.lendingDuration && (
                  <div style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    Lending Duration: {req.book.lendingDuration} days
                  </div>
                )}
                <div className="role-indicator lender-role">
                  <BookOpen size={16} />
                  <span>You are the LENDER</span>
                </div>
                <div className="user-info">
                  <div className="user-label">BORROWER:</div>
                  <img
                    src={req.borrower?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                    alt={req.borrower?.name || 'User'}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                  <p><strong>{req.borrower?.name || 'Unknown User'}</strong> wants to borrow your book</p>
                </div>
                <p className="request-date">Requested on: {formatDate(req.createdAt)}</p>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  marginTop: '0.5rem',
                  backgroundColor: 
                    req.status === 'pending' ? '#fef3c7' :
                    req.status === 'approved' ? '#dbeafe' :
                    req.status === 'borrowed' ? '#d1fae5' :
                    req.status === 'returned' ? '#e0e7ff' :
                    req.status === 'denied' ? '#fee2e2' : '#f3f4f6',
                  color:
                    req.status === 'pending' ? '#92400e' :
                    req.status === 'approved' ? '#1e40af' :
                    req.status === 'borrowed' ? '#065f46' :
                    req.status === 'returned' ? '#3730a3' :
                    req.status === 'denied' ? '#991b1b' : '#4b5563'
                }}>
                  Status: {req.status}
                </div>
                {req.status === 'pending' && (
                  <div className="card-actions">
                    <button onClick={() => handleStatusUpdate(req._id, 'denied')} className="btn deny-btn">
                      <X size={16} /> Deny
                    </button>
                    <button onClick={() => handleStatusUpdate(req._id, 'approved')} className="btn approve-btn">
                      <Check size={16} /> Approve
                    </button>
                  </div>
                )}
                {req.status === 'approved' && (
                  <div className="card-actions">
                    <Link to={`/messages?userId=${req.borrower._id}`} className="btn message-btn">
                      <MessageSquare size={16} /> Message {req.borrower?.name}
                    </Link>
                    <button onClick={() => handleMarkAsBorrowed(req._id)} className="btn borrowed-btn">
                      <Check size={16} /> Mark as Borrowed
                    </button>
                  </div>
                )}
                {req.status === 'returned' && (
                  <div className="card-actions">
                    <button
                      className="btn approve-btn"
                      onClick={() => setReviewModal({ open: true, borrowRequestId: req._id, toUserId: req.borrower?._id, counterpartName: req.borrower?.name || 'User' })}
                    >
                      Leave a Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState message="You have not received any borrow requests for your books yet." />;
    }

    if (activeTab === 'my') {
      // Filter out denied and reviewed returned requests from main view
      const activeRequests = myRequests.filter(req => 
        req.book && 
        req.owner && 
        req.status !== 'denied' && 
        !(req.status === 'returned' && reviewedRequests.has(req._id))
      );

      return activeRequests.length > 0 ? (
        <div className="requests-grid">
          {activeRequests.map(req => (
              <div key={req._id} className={`request-card ${req.status === 'approved' ? 'approved-card' : ''}`}>
                <div className="book-cover-container">
                  <img
                    src={getFullImageUrl(req.book?.coverImage)}
                    alt={req.book?.title || 'Book cover'}
                    className="book-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                </div>
                <div className="card-content">
                  {req.status === 'approved' && (
                    <div className="approval-banner">
                      <CheckCircle size={16} />
                      <span>Request Approved! 🎉</span>
                    </div>
                  )}
                  <div className="card-header">
                    <h3 className="book-title">{req.book?.title || 'Unknown Book'}</h3>
                    {renderStatusBadge(req.status)}
                  </div>
                  {req.book?.forBorrowing && req.book?.lendingDuration && (
                    <div style={{
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Lending Duration: {req.book.lendingDuration} days
                    </div>
                  )}
                  <div className="role-indicator borrower-role">
                    <User size={16} />
                    <span>You are the BORROWER</span>
                  </div>
                  <div className="user-info">
                    <div className="user-label">LENDER (Book Owner):</div>
                    <img
                      src={req.owner?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS2ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                      alt={req.owner?.name || 'User'}
                      className="user-avatar"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                      }}
                    />
                    <p>You requested from <strong>{req.owner?.name || 'Unknown User'}</strong></p>
                  </div>
                  <p className="request-date">Requested on: {formatDate(req.createdAt)}</p>
                  
                  {/* ============================================ */}
                  {/* SECURITY DEPOSIT: DISABLED FOR DEVELOPMENT */}
                  {/* ============================================ */}
                  {/* Uncomment this section when ready to enable deposit payment UI */}
                  {/*
                  {req.status === 'approved' && req.depositStatus === 'pending' && req.depositAmount > 0 && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Shield size={18} color="#92400e" />
                        <strong style={{ color: '#92400e' }}>Security Deposit Required</strong>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#78350f', margin: '0 0 0.75rem 0' }}>
                        The owner requires a ₹{req.depositAmount} security deposit. This will be refunded when you return the book.
                      </p>
                      <button 
                        onClick={() => setDepositModal({ open: true, borrowRequest: req })}
                        className="btn"
                        style={{
                          backgroundColor: '#4F46E5',
                          color: 'white',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Shield size={16} />
                        Pay Security Deposit (₹{req.depositAmount})
                      </button>
                    </div>
                  )}
                  */}

                  {req.status === 'approved' && (
                    <>
                      {req.lendingFee > 0 && req.lendingFeeStatus === 'pending' && (
                        <div style={{
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #10B981',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginTop: '0.75rem',
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Wallet size={18} color="#059669" />
                            <strong style={{ color: '#065f46' }}>Lending Fee Required</strong>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#047857', margin: '0 0 0.75rem 0' }}>
                            The owner charges ₹{req.lendingFee} for lending this book. This fee supports the book sharing community.
                          </p>
                          <button 
                            onClick={() => setLendingFeeModal({ open: true, borrowRequest: req })}
                            className="btn"
                            style={{
                              backgroundColor: '#10B981',
                              color: 'white',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Wallet size={16} />
                            Pay Lending Fee (₹{req.lendingFee})
                          </button>
                        </div>
                      )}
                      <div className="card-actions">
                        <Link to={`/messages?userId=${req.owner._id}`} className="btn message-btn">
                          <MessageSquare size={16} /> Message {req.owner?.name}
                        </Link>
                        <div className="status-info">
                          <span className="status-text">
                            ✅ Coordinate pickup details through messaging
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {req.status === 'borrowed' && (
                    <div className="card-actions">
                      <Link to={`/messages?userId=${req.owner._id}`} className="btn message-btn">
                        <MessageSquare size={16} /> Message {req.owner?.name}
                      </Link>
                      <button onClick={() => handleMarkAsReturned(req._id)} className="btn return-btn">
                        <ArrowRight size={16} /> Return Book
                      </button>
                    </div>
                  )}
                  {req.status === 'returned' && (
                    <div className="card-actions" style={{ marginTop: 8 }}>
                      <button
                        className="btn approve-btn"
                        onClick={() => setReviewModal({ open: true, borrowRequestId: req._id, toUserId: req.owner?._id, counterpartName: req.owner?.name || 'User' })}
                      >
                        Leave a Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
          ))}
        </div>
      ) : (
        <EmptyState message="You haven't made any borrow requests yet. Go explore the community!" />
      );
    }

    if (activeTab === 'returned') {
      const returnedBooks = receivedRequests.filter(req => req.book && req.borrower && req.status === 'returned');

      return returnedBooks.length > 0 ? (
        <div className="requests-grid">
          {returnedBooks.map(req => (
            <div key={req._id} className="request-card returned-card">
              <div className="book-cover-container">
                <img
                  src={getFullImageUrl(req.book?.coverImage)}
                  alt={req.book?.title || 'Book cover'}
                  className="book-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                  }}
                />
                <div className="returned-badge">
                  <CheckCircle size={16} />
                  Returned
                </div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <h3 className="book-title">{req.book?.title || 'Unknown Book'}</h3>
                  {renderStatusBadge(req.status)}
                </div>
                <div className="role-indicator lender-role">
                  <BookOpen size={16} />
                  <span>Your Book (You were the LENDER)</span>
                </div>
                <div className="user-info">
                  <div className="user-label">BORROWER:</div>
                  <img
                    src={req.borrower?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                    alt={req.borrower?.name || 'User'}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                  <p>Returned by <strong>{req.borrower?.name || 'Unknown User'}</strong></p>
                </div>
                <p className="request-date">Returned on: {formatDate(req.returnedDate || req.actualReturnDate || req.updatedAt)}</p>
                
                {editingBook && editingBook.id === req.book._id ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Lending Duration (days)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={editingBook.lendingDuration}
                        onChange={(e) => setEditingBook({...editingBook, lendingDuration: parseInt(e.target.value)})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Security Deposit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingBook.securityDeposit}
                        onChange={(e) => setEditingBook({...editingBook, securityDeposit: parseInt(e.target.value)})}
                        className="form-input"
                      />
                    </div>
                    <div className="card-actions">
                      <button onClick={() => setEditingBook(null)} className="btn deny-btn">
                        Cancel
                      </button>
                      <button onClick={() => handleMakeAvailableAgain(req.book._id, req._id)} className="btn approve-btn">
                        <Check size={16} /> Save & Make Available
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card-actions">
                    <button
                      className="btn approve-btn"
                      onClick={() => setReviewModal({ open: true, borrowRequestId: req._id, toUserId: req.borrower?._id, counterpartName: req.borrower?.name || 'User' })}
                    >
                      Leave a Review
                    </button>
                    <button
                      className="btn make-available-btn"
                      onClick={() => handleMakeAvailableAgain(req.book._id, req._id)}
                    >
                      <Eye size={16} /> Make Available Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No returned books yet. Books will appear here once borrowers return them." />
      );
    }

    if (activeTab === 'history') {
      return renderBookHistory();
    }

    if (activeTab === 'wishlist') {
      return renderWishlist();
    }
  };

  return (
    <StyledWrapper>
      <div className="page-header">
        <h1 className="main-title">Borrowing Center</h1>
        <p className="subtitle">Manage requests for your books and track books you want to borrow.</p>
      </div>

      <div className="tabs-container">
        <div className="tabs-left">
          <button onClick={() => setActiveTab('received')} className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}>
            Requests for My Books
          </button>
          <button onClick={() => setActiveTab('my')} className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}>
            My Borrow Requests
          </button>
          <button onClick={() => setActiveTab('returned')} className={`tab-btn ${activeTab === 'returned' ? 'active' : ''}`}>
            Returned Books ({receivedRequests.filter(req => req.status === 'returned').length})
          </button>
          <button onClick={() => setActiveTab('history')} className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}>
            Book History
          </button>
          <button onClick={() => setActiveTab('wishlist')} className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}>
            <Heart size={16} />
            <span>Wishlist</span>
          </button>
        </div>
      </div>

      <div className="content-area">
        {renderContent()}
      </div>

      <ReviewModal
        open={reviewModal.open}
        counterpartName={reviewModal.counterpartName}
        onClose={() => setReviewModal({ open: false, borrowRequestId: null, toUserId: null, counterpartName: '' })}
        onSubmit={async ({ rating, comment }) => {
          await reviewsAPI.create({
            borrowRequestId: reviewModal.borrowRequestId,
            toUserId: reviewModal.toUserId,
            rating,
            comment,
          });
          // Mark this request as reviewed
          setReviewedRequests(prev => new Set([...prev, reviewModal.borrowRequestId]));
          // Emit event to notify other components about the new review
          window.dispatchEvent(new CustomEvent('review-updated', { detail: { userId: reviewModal.toUserId } }));
          setReviewModal({ open: false, borrowRequestId: null, toUserId: null, counterpartName: '' });
        }}
      />

      {/* Deposit Payment Modal */}
      <DepositPaymentModal
        isOpen={depositModal.open}
        borrowRequest={depositModal.borrowRequest}
        onClose={() => setDepositModal({ open: false, borrowRequest: null })}
        onSuccess={() => {
          fetchData(); // Refresh the data to show updated deposit status
        }}
      />

      {/* Lending Fee Payment Modal */}
      <LendingFeePaymentModal
        isOpen={lendingFeeModal.open}
        borrowRequest={lendingFeeModal.borrowRequest}
        onClose={() => setLendingFeeModal({ open: false, borrowRequest: null })}
        onSuccess={() => {
          fetchData(); // Refresh the data to show updated payment status
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && (
        <DeleteConfirmModal
          isOpen={deleteConfirmModal.open}
          bookTitle={deleteConfirmModal.bookTitle}
          onClose={() => setDeleteConfirmModal({ open: false, requestId: null, bookTitle: null })}
          onConfirm={() => {
            handleDeleteRequest(deleteConfirmModal.requestId);
            setDeleteConfirmModal({ open: false, requestId: null, bookTitle: null });
          }}
        />
      )}
    </StyledWrapper>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, bookTitle, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">
          <Trash2 size={48} />
        </div>
        <h2 className="delete-modal-title">Delete Request?</h2>
        <p className="delete-modal-message">
          Are you sure you want to permanently delete this request from history?
          {bookTitle && (
            <span className="delete-modal-book"> This action will remove the request for "<strong>{bookTitle}</strong>".</span>
          )}
        </p>
        <div className="delete-modal-actions">
          <button onClick={onClose} className="delete-modal-cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="delete-modal-confirm">
            <Trash2 size={18} />
            Delete Request
          </button>
        </div>
      </div>
    </div>
  );
};

const StyledWrapper = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;

  @media (min-width: 768px) {
    padding: 2rem 3rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #111827;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #4b5563;
    margin-top: 0.5rem;
  }

  .tabs-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
  }

  .tabs-left {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .tab-btn {
    padding: 1rem 1.5rem;
    margin: 0;
    border: none;
    background: none;
    font-size: 1rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    
    &:hover {
      color: #111827;
    }
    
    &.active {
      color: #4F46E5;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: #4F46E5;
      transform: scaleX(0);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    &.active::after {
      transform: scaleX(1);
    }
  }
  
  .content-area {
    min-height: 400px;
  }

  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    
    .animate-spin {
      width: 3rem;
      height: 3rem;
      color: #4F46E5;
    }
  }

  .requests-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    
    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1024px) {
      gap: 2rem;
    }
  }

  .request-card {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 160px;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07);
    }

    &.approved-card {
      border-color: #10b981;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
      
      &:hover {
        box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.15);
      }
    }

    @media (min-width: 768px) {
      min-height: 180px;
    }
  }

  .book-cover-container {
    width: 80px;
    height: 100%;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 0.5rem 0 0 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #f3f4f6;
    
    @media (min-width: 768px) {
      width: 100px;
    }
  }

  .book-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    background-color: #f9fafb;
  }

  .card-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .approval-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    color: #065f46;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    border: 1px solid #a7f3d0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .book-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.4;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
    text-transform: capitalize;
    flex-shrink: 0;
  }

  .role-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 700;
    
    &.lender-role {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border: 1px solid #93c5fd;
      color: #1e40af;
    }
    
    &.borrower-role {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      color: #92400e;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #374151;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    
    .user-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 100%;
      margin-bottom: 0.25rem;
    }
  }
  
  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .request-date {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .card-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    
    @media (min-width: 640px) {
      flex-direction: row;
      gap: 0.75rem;
    }
    
    .btn {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
      text-decoration: none;
      border: none;
      
      @media (min-width: 640px) {
        padding: 0.7rem 1.2rem;
      }
    }
    
    .deny-btn {
      background-color: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
      &:hover { background-color: #fee2e2; }
    }
    
    .approve-btn {
      background-color: #16a34a;
      color: white;
      border: 1px solid transparent;
      &:hover { background-color: #15803d; }
    }
    
    .message-btn {
      background-color: #4F46E5;
      color: white;
      border: 1px solid transparent;
      text-decoration: none;
      &:hover { background-color: #4338ca; }
    }
    
    .borrowed-btn {
      background-color: #059669;
      color: white;
      border: 1px solid transparent;
      &:hover { background-color: #047857; }
    }
    
    .return-btn {
      background-color: #f59e0b;
      color: white;
      border: 1px solid transparent;
      &:hover { background-color: #d97706; }
    }
  }
  
  .status-info {
    margin-top: 0.5rem;
    
    .status-text {
      font-size: 0.875rem;
      color: #059669;
      font-weight: 600;
      background-color: #ecfdf5;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      display: inline-block;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    background-color: #f9fafb;
    border-radius: 1rem;
  }
  
  .empty-icon-wrapper {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background-color: #eef2ff;
    color: #4F46E5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }
  
  .empty-message {
    font-size: 1rem;
    color: #4b5563;
    max-width: 400px;
    margin-top: 0.5rem;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #111827;
      }
    }
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  /* Delete Confirmation Modal Styles */
  .delete-confirm-modal {
    background: white;
    border-radius: 16px;
    max-width: 450px;
    width: 100%;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .delete-modal-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: #fef2f2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .delete-modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .delete-modal-message {
    font-size: 1rem;
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 2rem 0;

    .delete-modal-book {
      display: block;
      margin-top: 0.75rem;
      font-size: 0.9rem;
      color: #4b5563;
    }
  }

  .delete-modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .delete-modal-cancel {
    flex: 1;
    padding: 0.75rem 1.5rem;
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f3f4f6;
    }
  }

  .delete-modal-confirm {
    flex: 1;
    padding: 0.75rem 1.5rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &:hover {
      background: #b91c1c;
    }
  }
  .returned-card {
    border-color: #10b981;
    background: linear-gradient(to right, #f0fdf4, #ffffff);
  }

  .returned-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: #10b981;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .book-cover-container {
    position: relative;
  }

  .edit-form {
    margin-top: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .form-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #4F46E5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      }
    }
  }

  .make-available-btn {
    background-color: #4F46E5;
    color: white;
    border: 1px solid transparent;
    &:hover { background-color: #4338ca; }
  }

  /* History Tab Styles */
  .history-card {
    &.completed-transaction {
      border-color: #10b981;
      background: linear-gradient(to right, #f0fdf4, #ffffff);
    }

    &.denied-transaction {
      border-color: #ef4444;
      background: linear-gradient(to right, #fef2f2, #ffffff);
    }
  }

  .history-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &.completed {
      background: #10b981;
      color: white;
    }

    &.denied {
      background: #ef4444;
      color: white;
    }
  }

  .transaction-timeline {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;

    .timeline-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0.25rem 0;
      font-size: 0.875rem;

      .timeline-label {
        font-weight: 600;
        color: #374151;
      }

      .timeline-date {
        color: #6b7280;
      }
    }
  }

  .transaction-details {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;

    .detail-item {
      font-size: 0.875rem;
      color: #4b5563;
      background: #e0e7ff;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-weight: 600;
    }
  }

  /* Wishlist Styles */
  .wishlist-header {
    margin-bottom: 2rem;

    .wishlist-filters {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }
  }

  .wishlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .wishlist-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
  }

  .wishlist-book-cover {
    position: relative;
    overflow: hidden;

    .availability-badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;

      &.available {
        background: #dcfce7;
        color: #166534;
      }

      &.unavailable {
        background: #fee2e2;
        color: #991b1b;
      }
    }

    .wishlist-button-container {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }
  }

  .wishlist-card-content {
    padding: 1rem;
  }

  .wishlist-book-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s;

    &:hover {
      color: #2563eb;
    }
  }

  .wishlist-book-author {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  .wishlist-book-tags {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;

    .book-tag {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;

      &.category-tag {
        background: #f3f4f6;
        color: #374151;
      }

      &.condition-tag {
        background: #dbeafe;
        color: #1d4ed8;
      }
    }
  }

  .wishlist-owner-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    .owner-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #6b7280;
      font-size: 0.875rem;
      transition: color 0.2s;

      &:hover {
        color: #2563eb;
      }
    }

    .owner-avatar {
      width: 1.5rem;
      height: 1.5rem;
      background: #dbeafe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .owner-initial {
        font-size: 0.75rem;
        font-weight: 600;
        color: #1d4ed8;
      }
    }

    .location-indicator {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #9ca3af;
    }
  }

  .wishlist-action {
    .wishlist-action-btn {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;

      &.available {
        background: #2563eb;
        color: white;

        &:hover {
          background: #1d4ed8;
        }
      }

      &.unavailable {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }
    }
  }
`;

export default BorrowRequests;