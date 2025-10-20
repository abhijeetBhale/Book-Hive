import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
  Star,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
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
    console.log('Connecting to WebSocket at:', base);
    
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
      console.log('Navbar socket connected for notifications');
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
      console.log('New notification received:', notification);
      
      // Add to realtime notifications list (keep only 5 recent)
      setRealtimeNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification with better styling
      toast.success(notification.message, {
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
      console.log('Navbar socket disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Navbar socket reconnected after', attemptNumber, 'attempts');
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
          console.log('Fetching unread count for user:', user._id);
          const result = await notificationsAPI.getUnreadCount();
          console.log('Unread count result:', result);
          setUnreadCount(result.count || 0);
        } catch (error) {
          console.error('Error fetching unread count:', error);
          setUnreadCount(0);
        }
      } else {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const onRead = () => {
      console.log('Notifications read event triggered, refetching count');
      fetchUnread();
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
      console.log('Marking notification as read:', notification.id);
      
      // Mark this notification as read
      const response = await notificationsAPI.markAsRead([notification.id]);
      console.log('Mark as read response:', response);
      
      // Update local state
      setUnreadCount(prev => Math.max(0, prev - 1));
      setRealtimeNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event('notifications-read'));
      
      // Close dropdown
      setShowNotificationDropdown(false);
      
      // Navigate to the notification link if available
      if (notification.link) {
        window.location.href = notification.link;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-300 text-lg ${
      isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
    }`;

  const navLinks = [
    { to: '/users', text: 'Community', icon: <Users size={24} /> },
    { to: '/map', text: 'Map', icon: <Map size={24} /> },
    { to: '/my-books', text: 'My Books', icon: <BookMarked size={24} /> },
    { to: '/borrow-requests', text: 'Requests', icon: <ArrowLeftRight size={24} /> },
    { to: '/messages', text: 'Messages', icon: <MessageSquare size={24} /> },
    { to: '/friends', text: 'Friends', icon: <Heart size={24} /> },
  ];

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
            <div className="hidden md:block">
              <div className="flex items-center space-x-20">
                {user &&
                  navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `transition-colors duration-300 ${
                          isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
                        }`
                      }
                      title={link.text} // Tooltip for desktop
                    >
                      {({ isActive }) => (
                        <div className="relative flex flex-col items-center pt-4 pb-4">
                          {link.icon}
                          <span
                            className={`absolute bottom-1 h-1.5 w-3.5 right-0.9 rounded-full bg-green-500 transition-opacity duration-300 ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                          ></span>
                        </div>
                      )}
                    </NavLink>
                  ))}
              </div>
            </div>
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Real-time Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotificationCenter(!showNotificationCenter)}
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
                      <div ref={dropdownRef} className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <Link 
                              to="/profile#notifications" 
                              className="text-sm text-blue-600 hover:text-blue-800"
                              onClick={async () => {
                                setShowNotificationDropdown(false);
                                // Mark all notifications as read when viewing all
                                try {
                                  await notificationsAPI.markRead();
                                  setUnreadCount(0);
                                  window.dispatchEvent(new Event('notifications-read'));
                                } catch (error) {
                                  console.error('Error marking all notifications as read:', error);
                                }
                              }}
                            >
                              View All
                            </Link>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {realtimeNotifications.length > 0 ? (
                            realtimeNotifications.map((notification) => (
                              <div 
                                key={notification.id} 
                                className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  notification.read ? 'opacity-75' : ''
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start gap-3">
                                  <img 
                                    src={notification.fromUser?.avatar || `https://ui-avatars.com/api/?name=${notification.fromUser?.name}&background=4F46E5&color=fff`}
                                    alt={notification.fromUser?.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <p className="text-sm font-medium text-gray-900 pr-2">
                                        {notification.message}
                                      </p>
                                      {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(notification.createdAt).toLocaleTimeString([], { 
                                        hour: 'numeric', 
                                        minute: '2-digit', 
                                        hour12: true 
                                      })}
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
                    <img
                      key={user.avatar}
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
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
                  <Link to="/login">
                    <LoginButton />
                  </Link>
                  <Link to="/register">
                    <SignButton />
                  </Link>
                </div>
              )}
            </div>
            <div className="-mr-2 flex md:hidden">
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

        {isOpen && (
          <div className="md:hidden glass absolute w-full border-b border-gray-200/50">
            <div className="px-2 pt-2 pb-3 sm:px-3">
              {user && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={navLinkClass}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.text}
                    </NavLink>
                  ))}
                  <Link to="/profile" className="relative" onClick={() => setIsOpen(false)}>
                    <img
                      key={user.avatar}
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Link>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                {user ? (
                  <Button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LoginButton />
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <SignButton />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
    </header>
  );
};

export default Navbar;