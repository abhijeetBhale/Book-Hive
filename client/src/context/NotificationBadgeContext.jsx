import React, { createContext, useState, useEffect, useContext } from 'react';
import { borrowAPI, friendsAPI, messagesAPI } from '../utils/api';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';

export const NotificationBadgeContext = createContext();

export const NotificationBadgeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [badges, setBadges] = useState({
    requests: 0,      // Borrow requests
    messages: 0,      // Unread messages
    friends: 0,       // Friend requests
    community: 0,     // Community notifications
    map: 0,           // Map-related notifications
    myBooks: 0        // My books notifications
  });

  // Fetch initial badge counts
  const fetchBadgeCounts = async () => {
    if (!user?._id) return;

    try {
      const [borrowRes, friendsRes, messagesRes] = await Promise.all([
        borrowAPI.getReceivedRequests().catch(() => ({ data: { requests: [] } })),
        friendsAPI.getAll().catch(() => ({ data: { pending: [] } })),
        messagesAPI.getConversations().catch(() => ({ data: [] }))
      ]);

      // Count pending borrow requests
      const pendingRequests = (borrowRes.data.requests || []).filter(
        req => req.status === 'pending'
      ).length;

      // Count pending friend requests
      const pendingFriends = (friendsRes.data.pending || []).length;

      // Count unread messages
      const unreadMessages = (messagesRes.data || []).reduce((total, conv) => {
        return total + (conv.unreadCount || 0);
      }, 0);

      setBadges({
        requests: pendingRequests,
        messages: unreadMessages,
        friends: pendingFriends,
        community: 0,
        map: 0,
        myBooks: 0
      });
    } catch (error) {
      console.error('Error fetching badge counts:', error);
    }
  };

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!user?._id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    const socket = io(base, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Listen for new borrow requests
    socket.on('borrow_request:new', () => {
      setBadges(prev => ({ ...prev, requests: prev.requests + 1 }));
    });

    // Listen for borrow request updates
    socket.on('borrow_request:updated', () => {
      fetchBadgeCounts(); // Refresh all counts
    });

    // Listen for new friend requests
    socket.on('friend_request:new', () => {
      setBadges(prev => ({ ...prev, friends: prev.friends + 1 }));
    });

    // Listen for friend request updates
    socket.on('friend_request:updated', () => {
      fetchBadgeCounts(); // Refresh all counts
    });

    // Listen for new messages
    socket.on('message:new', (message) => {
      if (message.recipientId?._id === user._id || message.recipientId === user._id) {
        setBadges(prev => ({ ...prev, messages: prev.messages + 1 }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  // Initial fetch
  useEffect(() => {
    fetchBadgeCounts();
  }, [user?._id]);

  // Listen for manual badge updates
  useEffect(() => {
    const handleBadgeUpdate = (event) => {
      const { type, action } = event.detail || {};
      
      if (action === 'clear') {
        setBadges(prev => ({ ...prev, [type]: 0 }));
      } else if (action === 'refresh') {
        fetchBadgeCounts();
      } else if (action === 'decrement') {
        setBadges(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
      }
    };

    window.addEventListener('badge-update', handleBadgeUpdate);
    return () => window.removeEventListener('badge-update', handleBadgeUpdate);
  }, []);

  const clearBadge = (type) => {
    setBadges(prev => ({ ...prev, [type]: 0 }));
  };

  const refreshBadges = () => {
    fetchBadgeCounts();
  };

  return (
    <NotificationBadgeContext.Provider value={{ badges, clearBadge, refreshBadges }}>
      {children}
    </NotificationBadgeContext.Provider>
  );
};

export const useNotificationBadges = () => {
  const context = useContext(NotificationBadgeContext);
  if (!context) {
    throw new Error('useNotificationBadges must be used within NotificationBadgeProvider');
  }
  return context;
};
