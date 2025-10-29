import React from 'react';
import styled from 'styled-components';
import { Clock, AlertTriangle, Calendar, Book, User } from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageHelpers';

const NotificationWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.due-soon {
    border-left-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }

  &.overdue {
    border-left-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    animation: pulse 2s infinite;
  }

  &.due-today {
    border-left-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;

  &.due-soon {
    background: #fbbf24;
    color: white;
  }

  &.overdue {
    background: #ef4444;
    color: white;
  }

  &.due-today {
    background: #3b82f6;
    color: white;
  }
`;

const BookImage = styled.img`
  width: 48px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const Description = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &.due-soon {
    background: #fbbf24;
    color: white;
  }

  &.overdue {
    background: #ef4444;
    color: white;
  }

  &.due-today {
    background: #3b82f6;
    color: white;
  }
`;

const DueDateNotification = ({ notification, onClick }) => {
  const { metadata } = notification;
  const { book, daysDiff, dueDate } = metadata;
  
  const getNotificationType = () => {
    if (daysDiff < 0) return 'overdue';
    if (daysDiff === 0) return 'due-today';
    return 'due-soon';
  };

  const getIcon = () => {
    const type = getNotificationType();
    switch (type) {
      case 'overdue':
        return <AlertTriangle size={20} />;
      case 'due-today':
        return <Calendar size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getStatusText = () => {
    if (daysDiff < 0) {
      return `${Math.abs(daysDiff)} days overdue`;
    }
    if (daysDiff === 0) {
      return 'Due today';
    }
    if (daysDiff === 1) {
      return 'Due tomorrow';
    }
    return `Due in ${daysDiff} days`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const type = getNotificationType();

  return (
    <NotificationWrapper className={type} onClick={onClick}>
      <IconWrapper className={type}>
        {getIcon()}
      </IconWrapper>
      
      {book?.coverImage && (
        <BookImage 
          src={getFullImageUrl(book.coverImage)} 
          alt={book.title}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      
      <ContentWrapper>
        <Title>{notification.title}</Title>
        <Description>{notification.message}</Description>
        
        <MetaInfo>
          <MetaItem>
            <Book size={12} />
            <span>{book?.title}</span>
          </MetaItem>
          <MetaItem>
            <Calendar size={12} />
            <span>{formatDate(dueDate)}</span>
          </MetaItem>
        </MetaInfo>
      </ContentWrapper>
      
      <StatusBadge className={type}>
        {getStatusText()}
      </StatusBadge>
    </NotificationWrapper>
  );
};

export default DueDateNotification;