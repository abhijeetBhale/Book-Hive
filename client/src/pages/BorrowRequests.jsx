import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, Check, X, ArrowRight, Inbox } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageHelpers';
import toast from 'react-hot-toast';
import { borrowAPI } from '../utils/api';
import { formatDate } from '../utils/dateHelpers';

const BorrowRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');


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
              <img 
                src={getFullImageUrl(req.book?.coverImage)} 
                alt={req.book?.title || 'Book cover'} 
                className="book-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                }}
              />
              <div className="card-content">
                <div className="card-header">
                  <h3 className="book-title">{req.book?.title || 'Unknown Book'}</h3>
                  {renderStatusBadge(req.status)}
                </div>
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
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState message="You have not received any borrow requests for your books yet." />;
    }

    if (activeTab === 'my') {
      return myRequests.length > 0 ? (
        <div className="requests-grid">
          {myRequests.filter(req => req.book && req.owner).map(req => (
            <div key={req._id} className="request-card">
              <img 
                src={getFullImageUrl(req.book?.coverImage)} 
                alt={req.book?.title || 'Book cover'} 
                className="book-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEg2NVY4MEgzNVY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                }}
              />
              <div className="card-content">
                <div className="card-header">
                  <h3 className="book-title">{req.book?.title || 'Unknown Book'}</h3>
                  {renderStatusBadge(req.status)}
                </div>
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
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState message="You haven't made any borrow requests yet. Go explore the community!" />;
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
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  padding: 2rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;

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
  }

  .request-card {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    overflow: hidden;
    display: flex;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07);
    }
  }

  .book-cover {
    width: 100px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .card-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
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
    gap: 0.75rem;
    margin-top: 1rem;
    
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
`;

export default BorrowRequests;