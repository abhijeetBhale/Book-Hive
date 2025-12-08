import React, { createContext, useState, useEffect, useContext } from 'react';
import { borrowAPI, friendsAPI, messagesAPI, organizerAPI } from '../utils/api';
import { adminAPIService } from '../utils/adminAPI';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';

export const NotificationBadgeContext = createContext();

export const NotificationBadgeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [badges, setBadges] = useState({
    requests: 0,            // Borrow requests
    messages: 0,            // Unread messages
    friends: 0,             // Friend requests
    community: 0,           // Community notifications
    map: 0,                 // Map-related notifications
    myBooks: 0,             // My books notifications
    broadcasts: 0,          // New broadcasts
    events: 0,              // New events
    reports: 0,             // New reports
    topBooks: 0,            // New top books
    topCategories: 0,       // New top categories
    recentActivity: 0,      // Recent admin activity
    bookSharing: 0,         // Book sharing activity
    organizerApplications: 0, // Organizer applications
    adminBorrowRequests: 0  // Admin borrow requests
  });

  // Fetch initial badge counts
  const fetchBadgeCounts = async () => {
    if (!user?._id) return;
    try {
      const [borrowRes, friendsRes, messagesRes, organizerRes, reportsRes, adminBorrowRes] = await Promise.all([
        borrowAPI.getReceivedRequests().catch(() => ({ data: { requests: [] } })),
        friendsAPI.getAll().catch(() => ({ data: { pending: [] } })),
        messagesAPI.getConversations().catch(() => ({ data: [] })),
        // Only fetch admin badges if user has admin role
        (user.role === 'admin' || user.role === 'superadmin') ? organizerAPI.getApplications({ status: 'pending' }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        (user.role === 'admin' || user.role === 'superadmin') ? adminAPIService.getReports({ status: 'pending' }).catch(() => ({ data: { reports: [] } })) : Promise.resolve({ data: { reports: [] } }),
        (user.role === 'admin' || user.role === 'superadmin') ? adminAPIService.getBorrowRequests({ status: 'pending' }).catch(() => ({ data: { data: { borrowRequests: [] } } })) : Promise.resolve({ data: { data: { borrowRequests: [] } } })
      ]);

      const pendingRequests = (borrowRes.data.requests || []).filter(req => req.status === 'pending').length;
      const pendingFriends = (friendsRes.data.pending || []).length;
      const unreadMessages = (messagesRes.data || []).reduce((total, conv) => total + (conv.unreadCount || 0), 0);

      // Admin counts
      const pendingApplications = Array.isArray(organizerRes.data) ? organizerRes.data.length : (organizerRes.data?.length || 0);
      const pendingReports = (reportsRes.data.reports || []).length;
      const pendingAdminBorrowRequests = (adminBorrowRes.data?.data?.borrowRequests || []).length;

      setBadges(prev => ({
        ...prev,
        requests: pendingRequests,
        messages: unreadMessages,
        friends: pendingFriends,
        organizerApplications: pendingApplications,
        reports: pendingReports,
        adminBorrowRequests: pendingAdminBorrowRequests
      }));
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
    const socket = io(base, { auth: { token }, transports: ['websocket', 'polling'] });

    // Borrow requests
    socket.on('borrow_request:new', () => {
      setBadges(prev => ({ ...prev, requests: prev.requests + 1 }));
    });
    socket.on('borrow_request:updated', fetchBadgeCounts);

    // Friend requests
    socket.on('friend_request:new', () => {
      setBadges(prev => ({ ...prev, friends: prev.friends + 1 }));
    });
    socket.on('friend_request:updated', fetchBadgeCounts);

    // Messages
    socket.on('message:new', (message) => {
      if (message.recipientId?._id === user._id || message.recipientId === user._id) {
        setBadges(prev => ({ ...prev, messages: prev.messages + 1 }));
      }
    });

    // Events
    socket.on('event:new', () => {
      setBadges(prev => ({ ...prev, events: prev.events + 1 }));
    });
    socket.on('event:updated', fetchBadgeCounts);

    // Reports
    socket.on('report:new', () => {
      setBadges(prev => ({ ...prev, reports: prev.reports + 1 }));
    });
    socket.on('report:updated', fetchBadgeCounts);

    // Top books
    socket.on('top_book:new', () => {
      setBadges(prev => ({ ...prev, topBooks: prev.topBooks + 1 }));
    });
    socket.on('top_book:updated', fetchBadgeCounts);

    // Top categories
    socket.on('top_category:new', () => {
      setBadges(prev => ({ ...prev, topCategories: prev.topCategories + 1 }));
    });
    socket.on('top_category:updated', fetchBadgeCounts);

    // Recent activity
    socket.on('recent_activity:new', () => {
      setBadges(prev => ({ ...prev, recentActivity: prev.recentActivity + 1 }));
    });
    socket.on('recent_activity:updated', fetchBadgeCounts);

    // Book sharing activity
    socket.on('book_sharing:new', () => {
      setBadges(prev => ({ ...prev, bookSharing: prev.bookSharing + 1 }));
    });
    socket.on('book_sharing:updated', fetchBadgeCounts);

    // Organizer applications
    socket.on('organizer_application:new', () => {
      setBadges(prev => ({ ...prev, organizerApplications: prev.organizerApplications + 1 }));
    });
    socket.on('organizer_application:updated', fetchBadgeCounts);

    // Broadcasts
    socket.on('broadcast:new', () => {
      setBadges(prev => ({ ...prev, broadcasts: prev.broadcasts + 1 }));
    });
    socket.on('broadcast:response', () => {
      setBadges(prev => ({ ...prev, broadcasts: prev.broadcasts + 1 }));
    });
    socket.on('broadcast:fulfilled', fetchBadgeCounts);

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  // Initial fetch
  useEffect(() => {
    fetchBadgeCounts();
  }, [user?._id]);

  // Manual badge updates (clear, refresh, decrement)
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
