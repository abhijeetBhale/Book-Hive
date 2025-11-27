import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Users,
  Map,
  BookMarked,
  ArrowLeftRight,
  MessageSquare,
  Heart,
  Bell,
  Trash2,
  LibraryBig,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useNotificationBadges } from '../../context/NotificationBadgeContext';
import OptimizedAvatar from '../ui/OptimizedAvatar';
import Button from '../ui/Button';
import beeIcon from '../../assets/icons8-bee-100.png';
import LoginButton from '../LoginButton';
import SignButton from '../SignButton';
import { notificationsAPI } from '../../utils/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import NotificationCenter from '../notifications/NotificationCenter';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { badges, clearBadge } = useNotificationBadges();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const socketRef = useRef(null);
  const dropdownRef = useRef(null);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user?._id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

    const socket = io(base, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Socket connected
    });

    socket.on('connect_error', (error) => {
      console.error('Navbar socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
    });

    socket.on('new_notification', (notification) => {
      // Add to realtime notifications list (keep only 5 recent)
      setRealtimeNotifications(prev => [notification, ...prev.slice(0, 4)]);

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Show toast notification with better styling
      toast.success(notification.message || notification.title, {
        duration: 4000,
        icon: '📚',
        style: {
          background: '#f0f9ff',
          color: '#1e40af',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          fontSize: '14px'
        },
        position: 'top-right'
      });
    });

    socket.on('disconnect', (reason) => {
      // Socket disconnected
    });

    socket.on('reconnect', (attemptNumber) => {
      // Socket reconnected
    });

    socket.on('reconnect_error', (error) => {
      console.error('Navbar socket reconnection error:', error);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?._id]);

  useEffect(() => {
    const fetchUnread = async () => {
      if (user) {
        try {
          const result = await notificationsAPI.getUnreadCount();
          setUnreadCount(result.count || 0);
        } catch (error) {
          console.error('Error fetching unread count:', error);
          setUnreadCount(0);
        }
      } else {
        setUnreadCount(0);
      }
    };

    const fetchRecentNotifications = async () => {
      if (user) {
        try {
          const notifications = await notificationsAPI.getAll({ limit: 5 });
          setRealtimeNotifications(notifications || []);
        } catch (error) {
          console.error('Error fetching recent notifications:', error);
          setRealtimeNotifications([]);
        }
      }
    };

    fetchUnread();
    fetchRecentNotifications();

    const interval = setInterval(() => {
      fetchUnread();
      fetchRecentNotifications();
    }, 30000);

    const onRead = () => {
      fetchUnread();
      fetchRecentNotifications();
    };

    window.addEventListener('notifications-read', onRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', onRead);
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark this notification as read if it's not already read
      if (!notification.isRead) {
        await notificationsAPI.markAsRead([notification._id]);

        // Update local state
        setUnreadCount(prev => Math.max(0, prev - 1));
        setRealtimeNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );

        // Dispatch event to update other components
        window.dispatchEvent(new Event('notifications-read'));
      }

      // Close dropdown
      setShowNotificationDropdown(false);

      // Navigate to the notification link if available
      if (notification.metadata?.link) {
        window.location.href = notification.metadata.link;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // Prevent triggering the notification click

    try {
      await notificationsAPI.delete(notificationId);

      // Update local state - remove the notification
      setRealtimeNotifications(prev =>
        prev.filter(n => n._id !== notificationId)
      );

      // Update unread count if the deleted notification was unread
      const deletedNotification = realtimeNotifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Dispatch event to update other components
      window.dispatchEvent(new Event('notifications-read'));

      toast.success('Notification deleted', {
        icon: '',
        duration: 1000
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-300 text-lg ${isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
    }`;

  // Conditional navigation based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { to: '/events', text: 'Events', icon: <LibraryBig size={24} />, badgeKey: 'events', showForAll: true },
      { to: '/map', text: 'Map', icon: <Map size={24} />, badgeKey: 'map', showForAll: true },
    ];

    // Regular user links (always shown for authenticated users)
    const userLinks = [
      ...baseLinks,
      { to: '/users', text: 'Community', icon: <Users size={24} />, badgeKey: 'community' },
      { to: '/my-books', text: 'My Books', icon: <BookMarked size={24} />, badgeKey: 'myBooks' },
      { to: '/borrow-requests', text: 'Requests', icon: <ArrowLeftRight size={24} />, badgeKey: 'requests' },
      { to: '/messages', text: 'Messages', icon: <MessageSquare size={24} />, badgeKey: 'messages' },
      { to: '/friends', text: 'Friends', icon: <Heart size={24} />, badgeKey: 'friends' },
    ];

    return userLinks;
  };

  const navLinks = getNavLinks();

  // Compute aggregated admin badge count
  const adminBadgeCount = badges.events + badges.reports + badges.topBooks + badges.topCategories + badges.recentActivity + badges.bookSharing + badges.organizerApplications + badges.adminBorrowRequests;

  // Clear badge when navigating to a page
  useEffect(() => {
    const currentLink = navLinks.find(link => location.pathname === link.to);
    if (currentLink && currentLink.badgeKey) {
      clearBadge(currentLink.badgeKey);
    }
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="relative glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <img src={beeIcon} alt="BookHive logo" className="h-8 w-8" />
                <span className="text-2xl font-bold text-gray-800">BookHive</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden min-[1201px]:block">
              <div className="flex items-center space-x-20">
                {user &&
                  navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `transition-colors duration-300 ${isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'}`
                      }
                      title={link.text}
                    >
                      {({ isActive }) => (
                        <div className="relative flex flex-col items-center pt-4 pb-4">
                          <div className="relative">
                            {link.icon}
                            {badges[link.badgeKey] > 0 && (
                              <span
                                className="absolute bg-red-500 rounded-full shadow-lg"
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  border: '2px solid white',
                                  top: '-2px',
                                  right: '-2px',
                                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }}
                              />
                            )}
                          </div>
                          <span
                            className={`absolute bottom-1 h-1.5 w-3.5 right-0.9 rounded-full bg-green-500 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                          ></span>
                        </div>
                      )}
                    </NavLink>
                  ))}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="hidden min-[1201px]:block">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Admin Dashboard Button */}
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <Link
                      to="/admin-dashboard-secure"
                      className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                      title="Admin Dashboard"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                      Admin
                      {adminBadgeCount > 0 && (
                        <span
                          className="absolute bg-red-500 rounded-full shadow-lg"
                          style={{
                            width: '10px',
                            height: '10px',
                            border: '2px solid white',
                            top: '-2px',
                            right: '-2px',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                          }}
                        />
                      )}
                    </Link>
                  )}

                  {/* Notification Bell */}
                  <div className="relative" style={{ zIndex: 10000 }}>
                    <button
                      onClick={() => {
                        setShowNotificationDropdown(!showNotificationDropdown);
                        setShowNotificationCenter(false);
                      }}
                      className="relative p-2 text-gray-600 hover:text-primary transition-colors duration-300"
                    >
                      <Bell size={24} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotificationDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
                      >
                        <div className="p-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <Link
                              to="/profile#notifications"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => setShowNotificationDropdown(false)}
                            >
                              View All
                            </Link>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto relative custom-scrollbar">
                          {realtimeNotifications.length > 0 ? (
                            realtimeNotifications.map((notification) => (
                              <div
                                key={notification._id}
                                className={`p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors relative ${notification.isRead ? 'opacity-75' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                <div className="flex items-start gap-3 group">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Bell size={16} className="text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 pr-2">
                                        {notification.title && (
                                          <p className="text-sm font-semibold text-gray-900 mb-1">{notification.title}</p>
                                        )}
                                        <p className="text-sm text-gray-700">{notification.message}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {!notification.isRead && (
                                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                        )}
                                        <button
                                          onClick={(e) => handleDeleteNotification(notification._id, e)}
                                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200 rounded hover:bg-red-50"
                                          title="Delete notification"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              <Bell size={32} className="mx-auto mb-2 opacity-50" />
                              <p>No recent notifications</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to="/profile" className="relative">
                    <OptimizedAvatar
                      src={user.avatar}
                      name={user.name}
                      alt="avatar"
                      size="md"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Link>
                  <Button onClick={logout} variant="secondary" className="cursor-pointer">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login"><LoginButton /></Link>
                  <Link to="/register"><SignButton /></Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="-mr-2 flex min-[1201px]:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="min-[1201px]:hidden absolute w-full bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 pt-4 pb-4">
              {user && (
                <div className="flex flex-col items-start gap-3 py-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `transition-colors duration-300 text-base ${isActive ? 'text-primary font-semibold' : 'text-gray-700 hover:text-primary'}`
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="relative flex items-end gap-3 py-2 px-4 rounded-lg hover:bg-gray-50">
                        <span className="relative inline-block flex-shrink-0">
                          {link.icon}
                          {badges[link.badgeKey] > 0 && (
                            <span
                              className="absolute bg-red-500 rounded-full shadow-lg"
                              style={{
                                width: '10px',
                                height: '10px',
                                border: '2px solid white',
                                top: '-2px',
                                right: '-2px'
                              }}
                            />
                          )}
                        </span>
                        <span>{link.text}</span>
                      </div>
                    </NavLink>
                  ))}

                  <button
                    onClick={() => {
                      setShowNotificationCenter(true);
                      setIsOpen(false);
                    }}
                    className="relative flex items-center gap-3 py-2 px-4 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-300"
                  >
                    <span className="relative inline-block flex-shrink-0">
                      <Bell size={24} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                    <span>Notifications</span>
                  </button>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 py-2 px-4 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="relative inline-block flex-shrink-0">
                      <OptimizedAvatar
                        src={user.avatar}
                        name={user.name}
                        alt="avatar"
                        size="sm"
                      />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                      )}
                    </span>
                    <span>Profile</span>
                  </Link>

                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <Link
                      to="/admin-dashboard-secure"
                      className="flex items-center gap-3 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md"
                      onClick={() => setIsOpen(false)}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                      <span className="font-semibold">Admin Dashboard</span>
                      {adminBadgeCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {adminBadgeCount}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                {user ? (
                  <Button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    variant="secondary"
                    className="w-full justify-center"
                  >
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Link to="/login" onClick={() => setIsOpen(false)}><LoginButton /></Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}><SignButton /></Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
    </header>
  );
};

// Add global styles for notification badge animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('notification-badge-styles')) {
  style.id = 'notification-badge-styles';
  document.head.appendChild(style);
}

export default Navbar;