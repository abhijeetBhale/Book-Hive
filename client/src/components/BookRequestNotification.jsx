import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle } from 'lucide-react';
import styled from 'styled-components';

const NotificationCard = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  
  .notification-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    
    .icon {
      color: #0ea5e9;
    }
    
    .title {
      font-weight: 600;
      color: #0c4a6e;
      font-size: 1.1rem;
    }
  }
  
  .notification-content {
    color: #0369a1;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .notification-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      
      &.primary {
        background-color: #0ea5e9;
        color: white;
        
        &:hover {
          background-color: #0284c7;
          transform: translateY(-1px);
        }
      }
      
      &.secondary {
        background-color: white;
        color: #0ea5e9;
        border: 1px solid #0ea5e9;
        
        &:hover {
          background-color: #f0f9ff;
        }
      }
    }
  }
  
  .book-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    
    .book-cover {
      width: 40px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .book-details {
      .book-title {
        font-weight: 600;
        color: #0c4a6e;
        margin-bottom: 0.25rem;
      }
      
      .book-author {
        color: #0369a1;
        font-size: 0.875rem;
      }
    }
  }
`;

const BookRequestNotification = ({ request, type = 'approved' }) => {
  if (type === 'approved' && request.status === 'approved') {
    return (
      <NotificationCard>
        <div className="notification-header">
          <CheckCircle className="icon" size={24} />
          <span className="title">Book Request Approved! 🎉</span>
        </div>
        
        <div className="notification-content">
          Great news! <strong>{request.owner?.name}</strong> has approved your request to borrow their book.
          You can now coordinate the pickup details through direct messaging.
        </div>
        
        <div className="book-info">
          <img 
            src={request.book?.coverImage || '/default-book-cover.jpg'} 
            alt={request.book?.title}
            className="book-cover"
          />
          <div className="book-details">
            <div className="book-title">{request.book?.title}</div>
            <div className="book-author">by {request.book?.author}</div>
          </div>
        </div>
        
        <div className="notification-actions">
          <Link 
            to={`/messages?userId=${request.owner._id}`} 
            className="action-btn primary"
          >
            <MessageSquare size={16} />
            Message {request.owner?.name}
          </Link>
          
          <Link 
            to={`/profile/${request.owner._id}`} 
            className="action-btn secondary"
          >
            View Profile
          </Link>
        </div>
      </NotificationCard>
    );
  }
  
  return null;
};

export default BookRequestNotification;