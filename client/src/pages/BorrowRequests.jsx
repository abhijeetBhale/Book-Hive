import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, Check, X, ArrowRight, Inbox, CheckCircle, EyeOff, Eye } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageHelpers';
import toast from 'react-hot-toast';
import { borrowAPI, reviewsAPI } from '../utils/api';
import { formatDate } from '../utils/dateHelpers';
import ReviewModal from '../components/ReviewModal';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

const BorrowRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [showDeniedRequests, setShowDeniedRequests] = useState(false);

  // Close denied requests dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDeniedRequests && !event.target.closest('.denied-requests-section')) {
        setShowDeniedRequests(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDeniedRequests]);

  const [reviewModal, setReviewModal] = useState({ open: false, borrowRequestId: null, toUserId: null, counterpartName: '' });

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
      console.error('Failed to fetch borrow requests:', error);
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
      toast.error('Failed to mark book as borrowed');
      console.error('Mark as borrowed error:', error);
    }
  };

  const handleMarkAsReturned = async (requestId) => {
    try {
      await borrowAPI.markAsReturned(requestId);
      toast.success('Book returned successfully! You can now leave a review.');
      fetchData();
    } catch (error) {
      toast.error('Failed to mark book as returned');
      console.error('Mark as returned error:', error);
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
      return receivedRequests.length > 0 ? (
        <div className="requests-grid">
          {receivedRequests.filter(req => req.book && req.borrower).map(req => (
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
                <div className="user-info">
                  <img
                    src={req.borrower?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                    alt={req.borrower?.name || 'User'}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                    }}
                  />
                  <p>{req.borrower?.name || 'Unknown User'} wants to borrow this book.</p>
                </div>
                <p className="request-date">Requested on: {formatDate(req.createdAt)}</p>
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
      // Filter out denied requests from main view
      const activeRequests = myRequests.filter(req => req.book && req.owner && req.status !== 'denied');
      const deniedRequests = myRequests.filter(req => req.book && req.owner && req.status === 'denied');

      return activeRequests.length > 0 ? (
        <div>
          {/* Denied Requests Button */}
          {deniedRequests.length > 0 && (
            <div className="denied-requests-section">
              <button
                onClick={() => setShowDeniedRequests(!showDeniedRequests)}
                className="denied-requests-toggle"
              >
                <EyeOff size={16} />
                Denied Requests ({deniedRequests.length})
                {showDeniedRequests ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              {showDeniedRequests && (
                <div className="denied-requests-dropdown">
                  <h4 className="denied-title">Denied Requests</h4>
                  <div className="denied-requests-list">
                    {deniedRequests.map(req => (
                      <div key={req._id} className="denied-request-item">
                        <img
                          src={getFullImageUrl(req.book?.coverImage)}
                          alt={req.book?.title || 'Book cover'}
                          className="denied-book-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                          }}
                        />
                        <div className="denied-book-info">
                          <h5 className="denied-book-title">{req.book?.title || 'Unknown Book'}</h5>
                          <p className="denied-book-owner">Requested from {req.owner?.name || 'Unknown User'}</p>
                          <p className="denied-book-date">Denied on: {formatDate(req.updatedAt || req.createdAt)}</p>
                        </div>
                        {renderStatusBadge(req.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
                  <div className="user-info">
                    <img
                      src={req.owner?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'}
                      alt={req.owner?.name || 'User'}
                      className="user-avatar"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMSIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNiAyMkM2IDE4LjY4NjMgOS42ODYyOSAxNSAxMyAxNUgxNUMxOC4zMTM3IDE1IDIyIDE4LjY4NjMgMjIgMjJWMjJINloiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                      }}
                    />
                    <p>Requested from {req.owner?.name || 'Unknown User'}.</p>
                  </div>
                  <p className="request-date">Requested on: {formatDate(req.createdAt)}</p>
                  {req.status === 'approved' && (
                    <div className="card-actions">
                      <Link to={`/messages?userId=${req.owner._id}`} className="btn message-btn">
                        <MessageSquare size={16} /> Message {req.owner?.name}
                      </Link>
                      <div className="status-info">
                        <span className="status-text">✅ Coordinate pickup details through messaging</span>
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
        </div>
      ) : (
        <div>
          {/* Show denied requests button even when no active requests */}
          {deniedRequests.length > 0 && (
            <div className="denied-requests-section">
              <button
                onClick={() => setShowDeniedRequests(!showDeniedRequests)}
                className="denied-requests-toggle"
              >
                <EyeOff size={16} />
                Denied Requests ({deniedRequests.length})
                {showDeniedRequests ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              {showDeniedRequests && (
                <div className="denied-requests-dropdown">
                  <h4 className="denied-title">Denied Requests</h4>
                  <div className="denied-requests-list">
                    {deniedRequests.map(req => (
                      <div key={req._id} className="denied-request-item">
                        <img
                          src={getFullImageUrl(req.book?.coverImage)}
                          alt={req.book?.title || 'Book cover'}
                          className="denied-book-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                          }}
                        />
                        <div className="denied-book-info">
                          <h5 className="denied-book-title">{req.book?.title || 'Unknown Book'}</h5>
                          <p className="denied-book-owner">Requested from {req.owner?.name || 'Unknown User'}</p>
                          <p className="denied-book-date">Denied on: {formatDate(req.updatedAt || req.createdAt)}</p>
                        </div>
                        {renderStatusBadge(req.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <EmptyState message="You haven't made any borrow requests yet. Go explore the community!" />
        </div>
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
        <button onClick={() => setActiveTab('received')} className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}>
          Requests for My Books
        </button>
        <button onClick={() => setActiveTab('my')} className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}>
          My Borrow Requests
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
          setReviewModal({ open: false, borrowRequestId: null, toUserId: null, counterpartName: '' });
        }}
      />
    </StyledWrapper>
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
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
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

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #374151;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
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

  /* Denied Requests Section */
  .denied-requests-section {
    position: relative;
    margin-bottom: 2rem;
  }

  .denied-requests-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 0.75rem;
    color: #dc2626;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: auto;
    width: fit-content;

    &:hover {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .denied-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 9;
    display: none;

    @media (max-width: 640px) {
      display: block;
    }
  }

  .denied-requests-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 10;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    min-width: 400px;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
    margin-top: 0.5rem;

    @media (max-width: 640px) {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      max-width: 90vw;
      min-width: unset;
      z-index: 11;
    }
  }

  .denied-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #fee2e2;
  }

  .denied-title {
    font-size: 1rem;
    font-weight: 700;
    color: #dc2626;
    margin: 0;
  }

  .denied-close-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: #fecaca;
    }

    @media (max-width: 640px) {
      display: flex;
    }
  }

  .denied-requests-list {
    padding: 0.5rem;
  }

  .denied-request-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid #f3f4f6;

    &:hover {
      background-color: #f9fafb;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .denied-book-cover {
    width: 40px;
    height: 60px;
    object-fit: cover;
    object-position: center;
    border-radius: 0.25rem;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .denied-book-info {
    flex-grow: 1;
    min-width: 0;
  }

  .denied-book-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
  }

  .denied-book-owner {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0 0 0.25rem 0;
  }

  .denied-book-date {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
  }
`;

export default BorrowRequests;