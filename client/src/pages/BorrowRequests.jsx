import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, Check, X, ArrowRight, Inbox, CheckCircle, EyeOff, Eye, Trash2, BookOpen, User, MessageSquare, Shield } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageHelpers';
import toast from 'react-hot-toast';
import { borrowAPI, reviewsAPI } from '../utils/api';
import { formatDate } from '../utils/dateHelpers';
import ReviewModal from '../components/ReviewModal';
import DepositPaymentModal from '../components/borrow/DepositPaymentModal';
import { Link } from 'react-router-dom';

const BorrowRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [showDeniedModal, setShowDeniedModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const [reviewModal, setReviewModal] = useState({ open: false, borrowRequestId: null, toUserId: null, counterpartName: '' });
  const [reviewedRequests, setReviewedRequests] = useState(new Set());
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, requestId: null, bookTitle: null });
  const [depositModal, setDepositModal] = useState({ open: false, borrowRequest: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [receivedRes, myRes] = await Promise.all([
        borrowAPI.getReceivedRequests(),
        borrowAPI.getMyRequests(),
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

    } catch (error) {
      toast.error('Failed to fetch borrow requests.');
      // Set empty arrays on error
      setReceivedRequests([]);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        </div>
        <button 
          onClick={() => setShowDeniedModal(true)} 
          className="denied-btn"
          title="View Denied Requests"
        >
          <EyeOff size={18} />
          Denied ({
            activeTab === 'received' 
              ? receivedRequests.filter(req => req.status === 'denied').length
              : myRequests.filter(req => req.status === 'denied').length
          })
        </button>
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

      {/* Denied Requests Modal */}
      {showDeniedModal && (
        <DeniedRequestsModal
          requests={activeTab === 'received' 
            ? receivedRequests.filter(req => req.status === 'denied')
            : myRequests.filter(req => req.status === 'denied')
          }
          isReceived={activeTab === 'received'}
          onClose={() => setShowDeniedModal(false)}
          onDelete={handleDeleteRequest}
          onOpenDeleteModal={setDeleteConfirmModal}
        />
      )}

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

// Denied Requests Modal Component
const DeniedRequestsModal = ({ requests, isReceived, onClose, onDelete, onOpenDeleteModal }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Denied Requests</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {requests.length === 0 ? (
            <div className="empty-denied">
              <EyeOff size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
              <p>No denied requests</p>
            </div>
          ) : (
            <div className="denied-list">
              {requests.map(req => (
                <div key={req._id} className="denied-item">
                  <img
                    src={getFullImageUrl(req.book?.coverImage)}
                    alt={req.book?.title || 'Book cover'}
                    className="denied-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                  <div className="denied-info">
                    <h4>{req.book?.title || 'Unknown Book'}</h4>
                    <p className="denied-user">
                      {isReceived 
                        ? `Requested by ${req.borrower?.name || 'Unknown User'}`
                        : `Requested from ${req.owner?.name || 'Unknown User'}`
                      }
                    </p>
                    <p className="denied-date">Denied on: {formatDate(req.updatedAt || req.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => onOpenDeleteModal({ open: true, requestId: req._id, bookTitle: req.book?.title })}
                    className="delete-denied-btn"
                    title="Delete from history"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
  }

  .tabs-left {
    display: flex;
  }

  .denied-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.5rem;

    &:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }
  }
  
  .tab-btn {
    padding: 1rem 0.5rem;
    margin: 0 1.5rem 0 0;
    border: none;
    background: none;
    font-size: 1rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease-in-out;
    
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

  .empty-denied {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;

    p {
      margin-top: 0.5rem;
      font-size: 1rem;
    }
  }

  .denied-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .denied-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    transition: all 0.2s;

    &:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .denied-cover {
      width: 60px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .denied-info {
      flex: 1;

      h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.5rem 0;
      }

      .denied-user {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 0.25rem 0;
      }

      .denied-date {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
      }
    }

    .delete-denied-btn {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      height: fit-content;

      &:hover {
        background: #fee2e2;
        border-color: #fca5a5;
      }
    }
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
`;

export default BorrowRequests;