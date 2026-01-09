import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { Bell, Sparkles } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { versionNotificationService } from '../../utils/versionNotificationAPI';
import VersionNotificationPopup from './VersionNotificationPopup';
import toast from 'react-hot-toast';

const VersionNotificationManager = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnviewedNotifications();
    }
  }, [user]);

  const fetchUnviewedNotifications = async () => {
    try {
      setLoading(true);
      const response = await versionNotificationService.getUnviewedNotifications();
      const unviewedNotifications = response.data.notifications || [];
      
      setNotifications(unviewedNotifications);
      
      // Show the most recent notification if any exist
      if (unviewedNotifications.length > 0) {
        const mostRecent = unviewedNotifications[0];
        setCurrentNotification(mostRecent);
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Error fetching unviewed notifications:', error);
      // Don't show error toast for notifications as it's not critical
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setCurrentNotification(null);
    
    // Show next notification if any
    const remainingNotifications = notifications.filter(
      n => n._id !== currentNotification?._id
    );
    
    if (remainingNotifications.length > 0) {
      setTimeout(() => {
        const nextNotification = remainingNotifications[0];
        setCurrentNotification(nextNotification);
        setShowPopup(true);
        setNotifications(remainingNotifications);
      }, 500); // Small delay between notifications
    } else {
      setNotifications([]);
    }
  };

  const handleShowNotifications = () => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications[0]);
      setShowPopup(true);
    } else {
      toast.success('No new notifications');
    }
  };

  // Don't render anything if user is not logged in
  if (!user) return null;

  return (
    <>
      {/* Notification Bell Icon */}
      {notifications.length > 0 && (
        <NotificationBell onClick={handleShowNotifications}>
          <Bell size={20} />
          {notifications.length > 0 && (
            <NotificationBadge>
              {notifications.length > 9 ? '9+' : notifications.length}
            </NotificationBadge>
          )}
        </NotificationBell>
      )}

      {/* Version Notification Popup */}
      <VersionNotificationPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        notification={currentNotification}
      />
    </>
  );
};

// Styled Components
const NotificationBell = styled.button`
  position: fixed;
  bottom: 8rem;
  right: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
  z-index: 30;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  @media (max-width: 768px) {
    bottom: 6rem;
    right: 1rem;
    width: 44px;
    height: 44px;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    50% {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
    }
    100% {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid white;
`;

export default VersionNotificationManager;