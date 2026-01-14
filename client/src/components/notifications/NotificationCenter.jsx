/**
 * NotificationCenter Component
 * 
 * Notification Types and their corresponding page links:
 * - borrow_request, request_approved, request_denied, review_prompt, due_reminder, overdue_reminder -> /borrow-requests
 * - new_message, broadcast_confirmed -> /messages
 * - friend_request, friend_accepted -> /friends
 * - broadcast_response -> /broadcasts
 * - new_book_nearby, availability_alert -> /books/{bookId}
 * - rating_received -> /profile
 */

import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Settings,
  BookOpen,
  MessageSquare,
  Users,
  AlertCircle,
  Calendar,
  Star,
  MapPin
} from 'lucide-react';
import { notificationsAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import VerificationNotification from './VerificationNotification';

const NotificationCenterWrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: white;
`;

const FilterTab = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$active ? '#4f46e5' : '#6b7280'};
  border-bottom: 2px solid ${props => props.$active ? '#4f46e5' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4f46e5;
    background: #f9fafb;
  }
`;

const NotificationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
`;

const NotificationItem = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: ${props => props.$read ? '#f9fafb' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: #f3f4f6;
  }

  ${props => !props.$read && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #4f46e5;
    }
  `}
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const NotificationIcon = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
  background: ${props => {
    switch (props.type) {
      case 'borrow_request': return '#dbeafe';
      case 'request_accepted': return '#d1fae5';
      case 'new_message': return '#e0e7ff';
      case 'due_reminder': return '#fef3c7';
      case 'overdue_reminder': return '#fee2e2';
      case 'friend_activity': return '#f3e8ff';
      case 'availability_alert': return '#ecfdf5';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'borrow_request': return '#2563eb';
      case 'request_accepted': return '#059669';
      case 'new_message': return '#4f46e5';
      case 'due_reminder': return '#d97706';
      case 'overdue_reminder': return '#dc2626';
      case 'friend_activity': return '#7c3aed';
      case 'availability_alert': return '#10b981';
      default: return '#6b7280';
    }
  }};
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationMessage = styled.p`
  font-size: 0.875rem;
  color: #374151;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
`;

const NotificationTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const NotificationActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;

  ${NotificationItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  p {
    font-size: 0.875rem;
    margin: 0;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
`;

const BulkActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
`;

const BulkButton = styled.button`
  background: none;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &.primary {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;

    &:hover {
      background: #4338ca;
    }
  }

  &.danger {
    color: #dc2626;
    border-color: #fca5a5;

    &:hover {
      background: #fef2f2;
      border-color: #f87171;
    }
  }
`;

const getNotificationIcon = (type) => {
  switch (type) {
    case 'borrow_request':
    case 'request_accepted':
    case 'request_declined':
      return <BookOpen size={16} />;
    case 'new_message':
      return <MessageSquare size={16} />;
    case 'friend_activity':
      return <Users size={16} />;
    case 'due_reminder':
    case 'overdue_reminder':
      return <Calendar size={16} />;
    case 'availability_alert':
    case 'new_book_nearby':
      return <MapPin size={16} />;
    case 'rating_received':
      return <Star size={16} />;
    default:
      return <Bell size={16} />;
  }
};

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
      loadStats();
    }
  }, [isOpen, user, activeFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let response;
      if (activeFilter === 'all') {
        response = await notificationsAPI.getAll({ limit: 50 });
      } else {
        response = await notificationsAPI.getNotificationsByType(activeFilter, { limit: 50 });
      }
      setNotifications(Array.isArray(response) ? response : response.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await notificationsAPI.getNotificationStats();
      const statsObj = {};
      if (Array.isArray(response)) {
        response.forEach(stat => {
          statsObj[stat._id] = stat.unread;
        });
        statsObj.totalUnread = response.reduce((sum, stat) => sum + stat.unread, 0);
      }
      setStats(statsObj);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationsAPI.markAsRead([notification._id]);
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      }

      // Navigate to the notification link if available
      const link = notification.link || notification.metadata?.link;
      if (link) {
        onClose(); // Close the notification panel before navigating
        navigate(link);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead([notificationId]);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationsAPI.clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.isRead));
      toast.success('Read notifications cleared');
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      toast.error('Failed to clear read notifications');
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: stats.totalUnread || 0 },
    { key: 'borrow_request', label: 'Requests', count: 0 },
    { key: 'new_message', label: 'Messages', count: 0 },
    { key: 'due_reminder', label: 'Reminders', count: 0 },
    { key: 'friend_activity', label: 'Friends', count: 0 }
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    return notification.type === activeFilter;
  });

  if (!isOpen) return null;

  return (
    <NotificationCenterWrapper isOpen={isOpen}>
      <Header>
        <h2>Notifications</h2>
        <HeaderActions>
          <IconButton title="Settings">
            <Settings size={18} />
          </IconButton>
          <IconButton onClick={onClose} title="Close">
            <X size={18} />
          </IconButton>
        </HeaderActions>
      </Header>

      <FilterTabs>
        {filterTabs.map(tab => (
          <FilterTab
            key={tab.key}
            active={activeFilter === tab.key}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && ` (${tab.count})`}
          </FilterTab>
        ))}
      </FilterTabs>

      <NotificationsList>
        {loading ? (
          <LoadingState>
            <div>Loading notifications...</div>
          </LoadingState>
        ) : (
          <>
            {/* Verification Notification - Always at the top for unverified users */}
            <VerificationNotification />
            
            {filteredNotifications.length === 0 ? (
              <EmptyState>
                <Bell size={48} />
                <h3>No notifications</h3>
                <p>You're all caught up! New notifications will appear here.</p>
              </EmptyState>
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification._id}
                  read={notification.isRead}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <NotificationHeader>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <NotificationIcon type={notification.type}>
                        {getNotificationIcon(notification.type)}
                      </NotificationIcon>
                      <NotificationContent>
                        {notification.title && (
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: '#374151' }}>
                            {notification.title}
                          </div>
                        )}
                        <NotificationMessage>
                          {notification.message}
                        </NotificationMessage>
                        <NotificationMeta>
                          <NotificationTime>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </NotificationTime>
                          {notification.metadata?.priority === 'urgent' && (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>URGENT</span>
                          )}
                        </NotificationMeta>
                      </NotificationContent>
                    </div>
                    <NotificationActions>
                      {!notification.isRead && (
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </ActionButton>
                      )}
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </ActionButton>
                    </NotificationActions>
                  </NotificationHeader>
                </NotificationItem>
              ))
            )}
          </>
        )}
      </NotificationsList>

      {filteredNotifications.length > 0 && (
        <BulkActions>
          <BulkButton onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} style={{ marginRight: '0.5rem' }} />
            Mark All Read
          </BulkButton>
          <BulkButton className="danger" onClick={handleClearRead}>
            <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
            Clear Read
          </BulkButton>
        </BulkActions>
      )}
    </NotificationCenterWrapper>
  );
};

export default NotificationCenter;