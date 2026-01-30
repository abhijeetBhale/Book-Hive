import React, { useContext, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import { authAPI, borrowAPI, messagesAPI, reportAPI, usersAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageHelpers';

// Import new icons for the password fields
import { Loader, Camera, MapPin, User, Mail, Bell, Lock, BookOpen, Trash2, Eye, EyeOff, AlertTriangle, ArrowLeft, Trophy, Shield, Activity, RefreshCw, Search, CheckCircle, ChevronRight, Star, BadgeCheck, Wallet, MessageSquare, Heart } from 'lucide-react';
import GamificationSection from '../components/profile/GamificationSection';
import ReviewsModal from '../components/ReviewsModal';
import VerifiedBadge from '../components/ui/VerifiedBadge';
import AccountDeletion from '../components/profile/AccountDeletion';
import UserStatistics from '../components/user/UserStatistics';
import ReadingPreferences from '../components/user/ReadingPreferences';
import WalletBalance from '../components/wallet/WalletBalance';
import TransactionHistory from '../components/wallet/TransactionHistory';
import WithdrawalModal from '../components/wallet/WithdrawalModal';
import { walletAPI } from '../utils/walletAPI';
import { useNavigate } from 'react-router-dom';

// Notifications Section Component
const NotificationsSection = ({ onNotificationCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { notificationsAPI } = await import('../utils/api');
      const response = await notificationsAPI.getAll({ limit: 100 });
      setNotifications(response || []);
      
      // Update parent component with unread count
      const unreadCount = (response || []).filter(n => !n.isRead).length;
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
      if (onNotificationCountChange) {
        onNotificationCountChange(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt);
      const notifDateString = notifDate.toDateString();
      const todayString = today.toDateString();
      const yesterdayString = yesterday.toDateString();

      let groupKey;
      if (notifDateString === todayString) {
        groupKey = 'Today';
      } else if (notifDateString === yesterdayString) {
        groupKey = 'Yesterday';
      } else {
        // Format as "Month Day, Year" for older dates
        groupKey = notifDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  };

  // Get icon for notification type
  const getNotificationIcon = (type, severity) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'borrow_request':
        return <BookOpen {...iconProps} />;
      case 'request_approved':
        return <CheckCircle {...iconProps} />;
      case 'request_denied':
        return <AlertTriangle {...iconProps} />;
      case 'friend_request':
      case 'friend_accepted':
        return <User {...iconProps} />;
      case 'message':
        return <MessageSquare {...iconProps} />;
      case 'review_prompt':
        return <Heart {...iconProps} />;
      case 'event_invitation':
      case 'event_reminder':
        return <Activity {...iconProps} />;
      case 'warning':
      case 'ban':
        return <AlertTriangle {...iconProps} />;
      case 'success':
        return <CheckCircle {...iconProps} />;
      default:
        return severity === 'warning' ? <AlertTriangle {...iconProps} /> : <Bell {...iconProps} />;
    }
  };

  // Get icon color based on type and severity
  const getIconColor = (type, severity) => {
    switch (type) {
      case 'borrow_request':
        return '#3b82f6'; // blue
      case 'request_approved':
      case 'success':
        return '#10b981'; // green
      case 'request_denied':
      case 'warning':
      case 'ban':
        return '#ef4444'; // red
      case 'friend_request':
      case 'friend_accepted':
        return '#8b5cf6'; // purple
      case 'message':
        return '#06b6d4'; // cyan
      case 'review_prompt':
        return '#f59e0b'; // amber
      case 'event_invitation':
      case 'event_reminder':
        return '#6366f1'; // indigo
      default:
        return severity === 'warning' ? '#ef4444' : '#6b7280'; // red or gray
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        const { notificationsAPI } = await import('../utils/api');
        await notificationsAPI.markAsRead([notification._id]);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );

        // Update parent component with new unread count
        const updatedNotifications = notifications.map(n => 
          n._id === notification._id ? { ...n, isRead: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        if (onNotificationCountChange) {
          onNotificationCountChange(unreadCount);
        }

        // Notify other components
        window.dispatchEvent(new Event('notifications-read'));
      }

      // Navigate to link if available
      if (notification.metadata?.link) {
        window.location.href = notification.metadata.link;
      } else if (notification.link) {
        window.location.href = notification.link;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();

    try {
      const { notificationsAPI } = await import('../utils/api');
      await notificationsAPI.delete(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update parent component with new unread count
      const updatedNotifications = notifications.filter(n => n._id !== notificationId);
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount);
      }
      
      // Notify other components
      window.dispatchEvent(new Event('notifications-read'));
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const { notificationsAPI } = await import('../utils/api');
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Update parent component with new unread count (0)
      if (onNotificationCountChange) {
        onNotificationCountChange(0);
      }
      
      // Notify other components
      window.dispatchEvent(new Event('notifications-read'));
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const groupedNotifications = groupNotificationsByDate(notifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="notifications-loading">
        <Loader className="animate-spin" size={32} />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-section">
      <div className="notifications-header">
        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-button"
              onClick={handleMarkAllAsRead}
            >
              <CheckCircle size={16} />
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      <div className="notifications-content">
        <div className="notifications-scroll-container">
          {Object.keys(groupedNotifications).length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <h4>No notifications yet</h4>
              <p>When you have new activity, notifications will appear here.</p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
              <div key={dateGroup} className="notification-group">
                <div className="group-header">
                  <h4>{dateGroup}</h4>
                  <span className="group-count">
                    {groupNotifications.length} {groupNotifications.length === 1 ? 'notification' : 'notifications'}
                  </span>
                </div>
                
                <div className="notification-list">
                  {groupNotifications.map(notification => (
                    <div 
                      key={notification._id}
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon" style={{ color: getIconColor(notification.type, notification.severity) }}>
                        {getNotificationIcon(notification.type, notification.severity)}
                      </div>
                      
                      <div className="notification-content">
                        <div className="notification-header">
                          <h5>{notification.title}</h5>
                          <div className="notification-actions">
                            <span className="notification-time">
                              {new Date(notification.createdAt).toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                              })}
                            </span>
                            {!notification.isRead && (
                              <div className="unread-indicator" />
                            )}
                            <button
                              className="delete-button"
                              onClick={(e) => handleDeleteNotification(notification._id, e)}
                              title="Delete notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <p className="notification-message">{notification.message}</p>
                        
                        {(notification.metadata?.link || notification.link) && (
                          <button className="view-button">
                            <Eye size={14} />
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, setUser, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  // --- STATE FOR REPORT USER ---
  const [reportData, setReportData] = useState({
    reportedUserId: '',
    reason: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); // Store selected user info
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- STATE FOR SECURITY TAB ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState([]);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: '30',
    accountVisibility: 'public'
  });

  // Account activity state
  const [accountActivity, setAccountActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [notifications, setNotifications] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    messages: [],
    pendingList: [],
    approvedList: []
  });

  // State for notification count in sidebar
  const [notificationCount, setNotificationCount] = useState(0);

  // Wallet state
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Handle URL hash to set active tab
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash === 'notifications') {
      setActiveTab('notifications');
    } else if (hash === 'wallet') {
      setActiveTab('wallet');
    }
  }, []);

  // Also listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash === 'notifications') {
        setActiveTab('notifications');
      } else if (hash === 'wallet') {
        setActiveTab('wallet');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen for review updates to refresh profile data
  useEffect(() => {
    const handleReviewUpdate = async (event) => {
      if (event.detail?.userId === user._id) {
        // Instead of calling fetchProfile which might overwrite user state,
        // fetch only the updated rating data and merge it with existing user data
        try {
          const { data } = await authAPI.getProfile();
          setUser(prevUser => ({
            ...prevUser,
            rating: data.rating // Only update the rating field
          }));
        } catch (error) {
          // Fallback to full profile refresh if needed
          fetchProfile();
        }
      }
    };

    window.addEventListener('review-updated', handleReviewUpdate);
    return () => window.removeEventListener('review-updated', handleReviewUpdate);
  }, [user._id, fetchProfile]);

  useEffect(() => {
    // Fetch notification count for sidebar
    const fetchNotificationCount = async () => {
      try {
        const { notificationsAPI } = await import('../utils/api');
        const response = await notificationsAPI.getUnreadCount();
        setNotificationCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      fetchNotificationCount();
    };

    window.addEventListener('notifications-read', handleNotificationUpdate);
    return () => window.removeEventListener('notifications-read', handleNotificationUpdate);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- HANDLER FOR PASSWORD FORM ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });

    // Check password strength for new password
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One number');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One special character');
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  // Security settings handler
  const handleSecuritySettingChange = (setting, value) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }));
  };

  // Save security settings
  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    try {
      await authAPI.updateSecuritySettings(securitySettings);
      toast.success('Security settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update security settings.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch account activity
  const fetchAccountActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await authAPI.getAccountActivity();
      const activityData = response.data.activity || [];

      // Convert timestamp strings to Date objects if needed
      const processedActivity = activityData.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));

      setAccountActivity(processedActivity);
    } catch (error) {
      // Don't show error toast as the API now exists
      // Just set empty array if there's an error
      setAccountActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    setWalletLoading(true);
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletAPI.getWalletDetails(),
        walletAPI.getTransactionHistory({ limit: 20 })
      ]);

      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data.transactions);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast.error('Failed to load wallet data');
      setWalletData(null);
      setTransactions([]);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWithdrawalRequest = async (withdrawalData) => {
    try {
      const response = await walletAPI.requestWithdrawal(withdrawalData);
      
      if (response.success) {
        // Refresh wallet data to show updated balance
        await fetchWalletData();
        return response;
      } else {
        throw new Error(response.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      throw error;
    }
  };

  // Load security settings from user profile
  useEffect(() => {
    if (user && user.securitySettings) {
      setSecuritySettings({
        twoFactorEnabled: user.securitySettings.twoFactorEnabled || false,
        emailNotifications: user.securitySettings.emailNotifications !== false,
        loginAlerts: user.securitySettings.loginAlerts !== false,
        sessionTimeout: user.securitySettings.sessionTimeout || '30',
        accountVisibility: user.securitySettings.accountVisibility || 'public'
      });
    }
  }, [user]);

  // Load account activity on security tab access
  useEffect(() => {
    if (activeTab === 'security') {
      fetchAccountActivity();
    }
  }, [activeTab]);

  // Load wallet data on wallet tab access
  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWalletData();
    }
  }, [activeTab]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if (avatarFile) {
      data.append('avatar', avatarFile);
    }
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    setLoading(true);
    try {
      const { getCurrentLocation } = await import('../utils/locationHelpers');
      const location = await getCurrentLocation();
      await authAPI.updateLocation(location);
      toast.success("Location updated successfully!");
      fetchProfile();
    } catch (error) {
      toast.error(error.message || "Failed to update location.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    // This function is no longer used since we redirect to dedicated notifications page
  };

  const handleDeleteMessage = async (messageId) => {
    // This function is no longer used since we redirect to dedicated notifications page
  };

  // --- HANDLERS FOR REPORT USER ---
  const handleSearchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await usersAPI.searchUsers({ keyword: searchQuery });
      setSearchResults(response.data.filter(u => u._id !== user._id)); // Filter out current user
    } catch (error) {
      console.error('Search users error:', error);
      toast.error("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If user starts typing after selecting someone, clear the selection
    if (reportData.reportedUserId && value !== selectedUser?.name) {
      setReportData(prev => ({ ...prev, reportedUserId: '' }));
      setSelectedUser(null);
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      handleSearchUsers(value);
    }, 300); // 300ms delay

    setSearchTimeout(newTimeout);
  };

  const handleSelectUser = (user) => {
    setReportData(prev => ({
      ...prev,
      reportedUserId: user._id
    }));
    setSelectedUser(user); // Store the selected user
    setSearchResults([]);
    setSearchTerm(user.name);
  };

  const handleReportChange = (e) => {
    setReportData({ ...reportData, [e.target.name]: e.target.value });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await reportAPI.createReport(reportData);
      toast.success("Report submitted successfully. Our team will review it shortly.");
      setReportData({ reportedUserId: '', reason: '', description: '' });
      setSelectedUser(null);
      setSearchTerm('');
      setActiveTab('security');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER FOR PASSWORD SUBMIT ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleAccountDeleted = () => {
    // Clear user data and redirect to home
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Your account has been deleted. We\'re sorry to see you go!');
    window.location.href = '/';
  };

  const totalNotifications = notificationCount;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleSubmit}>
            <div className="section-header">
              <h3>Profile</h3>
              <p>This information will be displayed publicly so be careful what you share.</p>
            </div>
            <div className="avatar-section">
              <div className="avatar-uploader" onClick={() => fileInputRef.current.click()}>
                <img
                  key={user.avatar}
                  src={avatarPreview || getFullImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff&size=128`}
                  alt="avatar"
                  className="avatar-image"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff&size=128`;
                  }}
                />
                <div className="camera-overlay"><Camera size={24} /></div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div>
                <h2 className="user-name">
                  {user.name}
                  {user.isVerified && <VerifiedBadge size={20} />}
                </h2>
                <p className="user-email">{user.email}</p>
                <div className="user-rating-section">
                  <div className="star-display">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star 
                        key={n} 
                        size={18} 
                        fill={n <= (user.rating?.starLevel || 0) ? '#f59e0b' : 'none'}
                        color={n <= (user.rating?.starLevel || 0) ? '#f59e0b' : '#d1d5db'}
                      />
                    ))}
                    <span className="star-level-text">
                      {user.rating?.starLevel || 0} {user.rating?.starLevel === 1 ? 'Star' : 'Stars'}
                    </span>
                  </div>
                  <button 
                    className="reviews-link"
                    onClick={() => setShowReviewsModal(true)}
                  >
                    {user.rating?.reviewCount || 0} {user.rating?.reviewCount === 1 ? 'Review' : 'Reviews'}
                  </button>
                </div>
              </div>
            </div>
            <div className="input-field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="input-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-footer">
              <button type="button" className="cancel-btn">Cancel</button>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? <Loader className="animate-spin" size={16} /> : 'Save changes'}
              </button>
            </div>
          </form>
        );
      case 'location':
        return (
          <div>
            <div className="section-header">
              <h3>Location</h3>
              <p>Manage your location settings for the community map.</p>
            </div>
            <div className="location-content">
              <p>Your location is used to connect you with nearby readers. We never share your exact address.</p>
              <button className="location-btn" onClick={handleUpdateLocation} disabled={loading}>
                <MapPin size={18} />
                {loading ? 'Updating...' : 'Update My Location'}
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div>
            <div className="section-header">
              <h3>Notifications</h3>
              <p>Stay updated with your BookHive activity</p>
            </div>
            <NotificationsSection onNotificationCountChange={setNotificationCount} />
          </div>
        );
      // --- JSX FOR NEW TABS ---
      case 'statistics':
        return <UserStatistics userId={user._id} showTitle={true} />;
      
      case 'preferences':
        return <ReadingPreferences showTitle={true} />;
      
      case 'wallet':
        return (
          <div>
            <div className="section-header">
              <h3>My Wallet</h3>
              <p>Manage your earnings from lending books and track your transaction history.</p>
            </div>
            <div className="wallet-content">
              <WalletBalance walletData={walletData} loading={walletLoading} />
              <div style={{ marginTop: '2rem' }}>
                <TransactionHistory transactions={transactions} loading={walletLoading} />
              </div>
              {walletData && walletData.pendingEarnings >= 100 && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button 
                    className="withdrawal-btn"
                    onClick={() => setShowWithdrawalModal(true)}
                    style={{
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#059669';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#10B981';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <Wallet size={20} />
                    Request Withdrawal
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'gamification':
        return <GamificationSection activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
      
      case 'security':
        return (
          <div>
            <div className="section-header">
              <h3>Security & Privacy</h3>
              <p>Manage your account security, privacy settings, and monitor account activity.</p>
            </div>

            {/* Password Update Section */}
            <div className="security-section">
              <div className="security-section-header">
                <Lock size={20} />
                <h4>Change Password</h4>
              </div>
              <p className="security-description">
                Keep your account secure by using a strong, unique password.
              </p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="input-field with-icon">
                  <label htmlFor="currentPassword">Current password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter your current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="icon-btn">
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="input-field with-icon">
                  <label htmlFor="newPassword">New password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter a strong new password"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="icon-btn">
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill strength-${passwordStrength}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="strength-text">
                      <span className={`strength-label strength-${passwordStrength}`}>
                        {passwordStrength === 0 && 'Very Weak'}
                        {passwordStrength === 1 && 'Weak'}
                        {passwordStrength === 2 && 'Fair'}
                        {passwordStrength === 3 && 'Good'}
                        {passwordStrength === 4 && 'Strong'}
                        {passwordStrength === 5 && 'Very Strong'}
                      </span>
                    </div>
                    {passwordFeedback.length > 0 && (
                      <div className="password-feedback">
                        <p>Password should include:</p>
                        <ul>
                          {passwordFeedback.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="input-field with-icon">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Confirm your new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="icon-btn">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {passwordData.confirmPassword && (
                  <div className={`password-match ${passwordData.newPassword === passwordData.confirmPassword ? 'match' : 'no-match'}`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <span className="match-text">✓ Passwords match</span>
                    ) : (
                      <span className="no-match-text">✗ Passwords do not match</span>
                    )}
                  </div>
                )}

                <div className="form-footer">
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={loading || passwordStrength < 3 || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    {loading ? <Loader className="animate-spin" size={16} /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Settings Section */}
            <div className="security-section">
              <div className="security-section-header">
                <Shield size={20} />
                <h4>Security Settings</h4>
              </div>
              <p className="security-description">
                Configure additional security measures for your account.
              </p>

              <div className="security-options">
                <div className="security-option">
                  <div className="option-info">
                    <h5>Two-Factor Authentication</h5>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <div className="option-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => handleSecuritySettingChange('twoFactorEnabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Email Notifications</h5>
                    <p>Get notified about important security events</p>
                  </div>
                  <div className="option-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.emailNotifications}
                        onChange={(e) => handleSecuritySettingChange('emailNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Login Alerts</h5>
                    <p>Get alerts when someone logs into your account</p>
                  </div>
                  <div className="option-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.loginAlerts}
                        onChange={(e) => handleSecuritySettingChange('loginAlerts', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Session Timeout</h5>
                    <p>Automatically log out after inactivity</p>
                  </div>
                  <div className="option-control">
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => handleSecuritySettingChange('sessionTimeout', e.target.value)}
                      className="security-select"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Account Visibility</h5>
                    <p>Control who can see your profile</p>
                  </div>
                  <div className="option-control">
                    <select
                      value={securitySettings.accountVisibility}
                      onChange={(e) => handleSecuritySettingChange('accountVisibility', e.target.value)}
                      className="security-select"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <button
                  className="save-btn"
                  onClick={handleSaveSecuritySettings}
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin" size={16} /> : 'Save Security Settings'}
                </button>
              </div>
            </div>

            {/* Account Activity Section */}
            <div className="security-section">
              <div className="security-section-header">
                <Activity size={20} />
                <h4>Recent Account Activity</h4>
              </div>
              <p className="security-description">
                Monitor recent logins and account changes for suspicious activity.
              </p>

              {loadingActivity ? (
                <div className="activity-loading">
                  <Loader className="animate-spin" size={20} />
                  <span>Loading activity...</span>
                </div>
              ) : (
                <div className="activity-list">
                  {accountActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.action === 'Login' && <User size={16} />}
                        {activity.action === 'Password Changed' && <Lock size={16} />}
                        {activity.action === 'Profile Updated' && <User size={16} />}
                      </div>
                      <div className="activity-details">
                        <div className="activity-main">
                          <strong>{activity.action}</strong>
                          <span className="activity-time">
                            {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="activity-meta">
                          <span>{activity.device}</span>
                          <span>•</span>
                          <span>{activity.location}</span>
                          <span>•</span>
                          <span>{activity.ip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="activity-actions">
                <button
                  className="secondary-btn"
                  onClick={fetchAccountActivity}
                  disabled={loadingActivity}
                >
                  <RefreshCw size={16} />
                  Refresh Activity
                </button>
                <button className="danger-btn">
                  <AlertTriangle size={16} />
                  Report Suspicious Activity
                </button>
              </div>
            </div>

            {/* Verification Badge Section */}
            <div className="security-section">
              <div className="security-section-header">
                <BadgeCheck size={20} />
                <h4>Verified Account Badge</h4>
              </div>
              <p className="security-description">
                Get the verified badge to build trust and stand out in the BookHive community.
              </p>
              
              {user.isVerified ? (
                <div className="verification-status verified">
                  <div className="status-icon">
                    <CheckCircle size={24} color="#10b981" />
                  </div>
                  <div className="status-content">
                    <h5>You're Verified! <VerifiedBadge size={18} /></h5>
                    <p>Your account has been verified since {new Date(user.verificationPurchaseDate).toLocaleDateString()}</p>
                    <div className="verified-benefits">
                      <span className="benefit-tag">✓ Trusted Profile</span>
                      <span className="benefit-tag">✓ Better Visibility</span>
                      <span className="benefit-tag">✓ Priority Support</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="verification-status not-verified">
                  <div className="status-content">
                    <h5>Get Verified</h5>
                    <p>Stand out with a verified badge next to your name by applying for verification.</p>
                    <ul className="verification-benefits">
                      <li>✓ Blue verified badge on your profile</li>
                      <li>✓ Increased trust from other users</li>
                      <li>✓ Better visibility in search results</li>
                      <li>✓ Priority customer support</li>
                    </ul>
                    <button
                      className="verification-btn"
                      onClick={() => navigate('/get-verified')}
                    >
                      <BadgeCheck size={16} />
                      Apply for Verification
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Report User Section */}
            <div className="security-section">
              <div className="security-section-header">
                <AlertTriangle size={20} />
                <h4>Report & Safety</h4>
              </div>
              <p className="security-description">
                Help keep our community safe by reporting inappropriate behavior or content.
              </p>
              <button
                className="report-btn"
                onClick={() => setActiveTab('report-user')}
              >
                <AlertTriangle size={16} /> Report a User
              </button>
            </div>

            {/* Account Deletion Section */}
            <AccountDeletion 
              user={user} 
              onAccountDeleted={handleAccountDeleted}
            />
          </div>
        );
      case 'report-user':
        return (
          <div>
            <div className="section-header">
              <button onClick={() => setActiveTab('security')} className="back-btn">
                <ArrowLeft size={20} /> Back to Security
              </button>
              <h3>Report a User</h3>
              <p>Help us keep the community safe by reporting inappropriate behavior or violations.</p>
            </div>

            {/* Report Guidelines */}
            <div className="report-guidelines">
              <div className="guidelines-header">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h4>Reporting Guidelines</h4>
              </div>
              <div className="guidelines-content">
                <p>Please only report users for genuine violations of our community standards:</p>
                <ul>
                  <li>• Harassment, bullying, or threatening behavior</li>
                  <li>• Fraudulent activities or scams</li>
                  <li>• Inappropriate or offensive content</li>
                  <li>• Fake profiles or impersonation</li>
                  <li>• Spam or unwanted solicitation</li>
                </ul>
                <p className="warning-text">
                  <strong>Note:</strong> False reports may result in action against your account.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport}>
              {/* Step 1: User Search */}
              <div className="report-step">
                <div className="step-header">
                  <div className="step-number">1</div>
                  <h4>Find the user you want to report</h4>
                </div>

                <div className="search-form">
                  <div className="input-field">
                    <label>Search for user</label>
                    <div className="search-input-wrapper">
                      <Search className="search-icon" size={20} />
                      <input
                        type="text"
                        placeholder="Enter username or email address"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        className="search-input"
                      />
                      {searchLoading && (
                        <div className="search-loading">
                          <Loader className="animate-spin" size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected User Display */}
                {reportData.reportedUserId && selectedUser && (
                  <div className="selected-user">
                    <div className="selected-user-header">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Selected User</span>
                    </div>
                    <div className="user-card selected">
                      <img
                        src={getFullImageUrl(selectedUser.avatar) ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=818cf8&color=fff`}
                        alt={selectedUser.name}
                        className="user-avatar"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=818cf8&color=fff`;
                        }}
                      />
                      <div className="user-info">
                        <strong>{selectedUser.name}</strong>
                        <span>{selectedUser.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReportData(prev => ({ ...prev, reportedUserId: '' }));
                          setSelectedUser(null);
                          setSearchTerm('');
                        }}
                        className="remove-selection"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && !reportData.reportedUserId && (
                  <div className="search-results">
                    <div className="results-header">
                      <span>{searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found</span>
                    </div>
                    {searchResults.map(user => (
                      <div
                        key={user._id}
                        className="user-card clickable"
                        onClick={() => handleSelectUser(user)}
                      >
                        <img
                          src={getFullImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=818cf8&color=fff`}
                          alt={user.name}
                          className="user-avatar"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=818cf8&color=fff`;
                          }}
                        />
                        <div className="user-info">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {searchLoading && searchTerm && (
                  <div className="search-loading">
                    <div className="loading-spinner"></div>
                    <p>Searching for users...</p>
                  </div>
                )}

                {/* No Results */}
                {searchResults.length === 0 && searchTerm && !searchLoading && !reportData.reportedUserId && (
                  <div className="no-results">
                    <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p>No users found matching "{searchTerm}"</p>
                    <p className="text-sm">Try searching with a different username or email address</p>
                  </div>
                )}
              </div>

              {/* Step 2: Report Details */}
              {reportData.reportedUserId && (
                <div className="report-step">
                  <div className="step-header">
                    <div className="step-number">2</div>
                    <h4>Provide report details</h4>
                  </div>

                  <div className="report-form">
                    <div className="input-field">
                      <label>What type of violation is this?</label>
                      <select
                        name="reason"
                        value={reportData.reason}
                        onChange={handleReportChange}
                        required
                        className="report-select"
                      >
                        <option value="">Select a violation type</option>
                        <option value="harassment">Harassment or Bullying</option>
                        <option value="inappropriate_behavior">Inappropriate Behavior</option>
                        <option value="scam">Scam or Fraudulent Activity</option>
                        <option value="fake_listing">Fake Book Listings</option>
                        <option value="spam">Spam or Unwanted Messages</option>
                        <option value="impersonation">Fake Profile or Impersonation</option>
                        <option value="threats">Threats or Violence</option>
                        <option value="other">Other Violation</option>
                      </select>
                    </div>

                    <div className="input-field">
                      <label>Detailed description</label>
                      <textarea
                        name="description"
                        placeholder="Please provide specific details about what happened, including dates, messages, or actions that violate our community guidelines..."
                        value={reportData.description}
                        onChange={handleReportChange}
                        required
                        rows={6}
                        className="report-textarea"
                      />
                      <div className="character-count">
                        {reportData.description.length}/1000 characters
                      </div>
                    </div>

                    {/* Evidence Upload (Future Enhancement) */}
                    <div className="evidence-section">
                      <label>Evidence (Optional)</label>
                      <div className="evidence-upload">
                        <div className="upload-placeholder">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p>Screenshots or other evidence</p>
                          <p className="text-sm text-gray-500">Coming soon - For now, please describe evidence in detail above</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Submit */}
              {reportData.reportedUserId && reportData.reason && reportData.description && (
                <div className="report-step">
                  <div className="step-header">
                    <div className="step-number">3</div>
                    <h4>Review and submit</h4>
                  </div>

                  <div className="report-summary">
                    <div className="summary-card">
                      <h5>Report Summary</h5>
                      <div className="summary-item">
                        <strong>Reported User:</strong>
                        <span>{selectedUser?.name || 'Selected User'}</span>
                      </div>
                      <div className="summary-item">
                        <strong>Violation Type:</strong>
                        <span>{reportData.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                      <div className="summary-item">
                        <strong>Description:</strong>
                        <span>{reportData.description.substring(0, 100)}{reportData.description.length > 100 ? '...' : ''}</span>
                      </div>
                    </div>

                    <div className="submission-notice">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <div>
                        <p><strong>Before you submit:</strong></p>
                        <p>Our moderation team will review this report within 24-48 hours. You'll be notified of any actions taken.</p>
                      </div>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" onClick={() => setActiveTab('security')} className="cancel-btn">
                      <ArrowLeft size={16} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-report-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        );
      default:
        return (
          <div>
            <div className="section-header">
              <h3>Coming Soon</h3>
              <p>This feature is currently under development.</p>
            </div>
          </div>
        );
    }
  }

  return (
    <StyledWrapper>
      <div className="sidebar">
        <nav>
          <a href="#profile" onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
            <User size={20} /> My Profile
          </a>
          <a href="#location" onClick={() => setActiveTab('location')} className={activeTab === 'location' ? 'active' : ''}>
            <MapPin size={20} /> Location
          </a>
          <a href="#notifications" onClick={() => setActiveTab('notifications')} className={`notification-link ${activeTab === 'notifications' ? 'active' : ''}`}>
            <div className="bell-wrapper">
              <Bell size={20} />
              {totalNotifications > 0 && <span className="notification-badge"></span>}
            </div>
            <span>Notifications</span>
            {totalNotifications > 0 && <span className="notification-count">{totalNotifications}</span>}
          </a>
          <a href="#statistics" onClick={() => setActiveTab('statistics')} className={activeTab === 'statistics' ? 'active' : ''}>
            <Activity size={20} /> My Statistics
          </a>
          <a href="#wallet" onClick={() => setActiveTab('wallet')} className={activeTab === 'wallet' ? 'active' : ''}>
            <Wallet size={20} /> My Wallet
          </a>
          <a href="#preferences" onClick={() => setActiveTab('preferences')} className={activeTab === 'preferences' ? 'active' : ''}>
            <BookOpen size={20} /> Reading Preferences
          </a>
          <a href="#gamification" onClick={() => setActiveTab('gamification')} className={activeTab === 'gamification' ? 'active' : ''}>
            <Trophy size={20} /> Reading Journey
          </a>
          <a href="#security" onClick={() => setActiveTab('security')} className={activeTab === 'security' ? 'active' : ''}>
            <Lock size={20} /> Security
          </a>
          <a href="#report-user" onClick={() => setActiveTab('report-user')} className={activeTab === 'report-user' ? 'active' : ''}>
            <AlertTriangle size={20} /> Report User
          </a>
        </nav>
      </div>
      <div className="main-content">
        {renderContent()}
      </div>
      
      <ReviewsModal 
        open={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        userId={user._id}
        userName={user.name}
      />
      
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        walletBalance={walletData?.pendingEarnings || 0}
        onWithdrawalRequest={handleWithdrawalRequest}
      />
    </StyledWrapper>
  );
};

// --- STYLES ---
const StyledWrapper = styled.div`
  display: flex;
  max-width: 1200px;
  margin: 2rem auto;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  font-family: 'Inter', sans-serif;
  overflow: hidden;

  /* Mobile responsive layout */
  @media (max-width: 768px) {
    flex-direction: column;
    margin: 1rem;
    border-radius: 0.5rem;
  }
  
  .sidebar {
    width: 280px;
    flex-shrink: 0;
    background: #ffffff;
    padding: 2rem;
    border-right: 1px solid #e5e7eb;

    nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 600;
        color: #374151;
        transition: background-color 0.2s, color 0.2s;

        &:hover { background-color: #f3f4f6; }
        &.active { background-color: #f3f4f6; color: #111827; }
      }
    }

    /* Mobile responsive sidebar */
    @media (max-width: 768px) {
      width: 100%;
      padding: 1rem;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;

      nav {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.25rem;
        padding-bottom: 0.5rem;

        a {
          flex-shrink: 0;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          white-space: nowrap;

          svg {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }

  .notification-link {
    position: relative;
    justify-content: flex-start;
    .bell-wrapper { position: relative; }
    .notification-badge {
        position: absolute; top: -2px; right: -2px; width: 8px; height: 8px;
        border-radius: 50%; background-color: #ef4444; border: 1px solid white;
    }
    .notification-count {
        margin-left: auto; font-size: 0.8rem; font-weight: 700;
        background-color: #e0e7ff; color: #4f46e5;
        padding: 0.1rem 0.5rem; border-radius: 9999px;
    }
  }

  .main-content {
    flex: 1;
    padding: 3rem;
    background-color: #f9fafb;
    height: calc(100vh - 140px);
    overflow: hidden;

    /* Mobile responsive main content */
    @media (max-width: 768px) {
      padding: 1.5rem 1rem;
      height: auto;
      overflow: visible;
    }
    
    /* Report User Styles */
    .security-password-section {
      margin-bottom: 2rem;
    }
    
    .security-report-section {
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }
    
    .report-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #dc3545;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      margin-top: 1rem;
      
      &:hover {
        background-color: #f1f3f5;
        border-color: #dc3545;
      }
    }

    .section-header {
      padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 2rem;
      h3 { font-size: 1.5rem; font-weight: 700; color: #111827; }
      p { color: #6b7280; margin-top: 0.25rem; }
    }
    
    .avatar-section {
        display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem;

        /* Mobile responsive avatar section */
        @media (max-width: 768px) {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
    }
    .avatar-uploader {
        position: relative; cursor: pointer; border-radius: 50%;
        .avatar-image {
            height: 96px; width: 96px; border-radius: 50%; object-fit: cover;
            border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            transition: filter 0.2s ease-in-out;
        }
        .camera-overlay {
            position: absolute; inset: 0; background-color: rgba(17, 24, 39, 0.6);
            color: white; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; opacity: 0; transition: opacity 0.2s ease-in-out;
        }
        &:hover .avatar-image { filter: brightness(0.9); }
        &:hover .camera-overlay { opacity: 1; }
    }
    .user-name { font-size: 1.75rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem; }
    .user-email { font-size: 1rem; color: #6b7280; margin-bottom: 0.75rem; }
    
    .user-rating-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    
    .star-display {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .star-level-text {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
    }
    
    .reviews-link {
      background: none;
      border: none;
      color: #4F46E5;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      transition: all 0.2s;
      
      &:hover {
        background: #eef2ff;
        color: #4338ca;
      }
    }
    
    .input-field {
        margin-bottom: 1.5rem;
        position: relative; /* Added for icon positioning */
        label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151; }
        input {
            width: 100%; padding: 0.75rem 1rem; border: 1px solid #d1d5db;
            border-radius: 0.5rem; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s;
            &:focus {
                outline: none; border-color: #4f46e5;
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
            }
        }
        /* Style for inputs with an icon */
        &.with-icon input {
            padding-right: 3rem; /* Make space for the icon button */
        }
        .icon-btn {
            position: absolute;
            top: 50%;
            right: 0.5rem;
            transform: translateY(25%); /* Adjust vertical alignment */
            background: none;
            border: none;
            cursor: pointer;
            color: #9ca3af;
            padding: 0.25rem;
            &:hover {
                color: #374151;
            }
        }
    }

    .form-footer {
        display: flex; justify-content: flex-end; gap: 1rem;
        padding-top: 1.5rem; border-top: 1px solid #e5e7eb; margin-top: 2rem;

        /* Mobile responsive form footer */
        @media (max-width: 768px) {
          flex-direction: column;
          gap: 0.75rem;
        }
        .cancel-btn, .save-btn {
            padding: 0.6rem 1.25rem; border-radius: 0.5rem; font-weight: 600;
            cursor: pointer; border: 1px solid transparent; transition: all 0.2s;

            /* Mobile responsive buttons */
            @media (max-width: 768px) {
              width: 100%;
              padding: 0.75rem 1rem;
              justify-content: center;
            }
        }
        .cancel-btn {
            background: white; border-color: #d1d5db; color: #111827;
            &:hover { background-color: #f9fafb; }
        }
        .save-btn, .search-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
            background: #111827; color: white; display: flex; align-items: center; gap: 0.5rem;
            &:hover { background-color: #374151; }
            &:disabled { background-color: #9ca3af; cursor: not-allowed; }
        }
    }
    .location-content {
        p { margin-bottom: 1.5rem; color: #374151; line-height: 1.6; }
        .location-btn {
            display: inline-flex; align-items: center; gap: 0.5rem; background-color: white;
            color: #374151; border: 1px solid #d1d5db; font-size: 1rem; font-weight: 600;
            padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s;
            &:hover:not(:disabled) { background-color: #f9fafb; }
            &:disabled { color: #9ca3af; cursor: not-allowed; }
        }
    }
    /* Report User Form Styles */
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #6b7280;
      padding: 0.5rem 0;
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 1rem;
      
      &:hover {
        color: #111827;
      }
    }
    
    .search-form {
      position: relative;
      margin-bottom: 1rem;
      
      .input-field {
        position: relative;
        
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          
          &:focus {
            outline: none;
            border-color: #4F46E5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
          }
        }
        
        .search-loading {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 0.875rem;
        }
      }
    }
    
    .search-results {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      
      .search-result-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid #e5e7eb;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background-color: #f3f4f6;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 1rem;
          object-fit: cover;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          
          strong {
            font-weight: 600;
            color: #111827;
          }
          
          span {
            font-size: 0.875rem;
            color: #6b7280;
          }
        }
      }
    }
    
    .no-results {
      padding: 1rem;
      text-align: center;
      color: #6b7280;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    /* Enhanced Security Tab Styles */
    .security-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .security-section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      
      h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
      
      svg {
        color: #4f46e5;
      }
    }

    .security-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    /* Password Strength Indicator */
    .password-strength {
      margin-top: 0.75rem;
      margin-bottom: 1rem;
    }

    .strength-bar {
      width: 100%;
      height: 4px;
      background-color: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 2px;
      
      &.strength-0, &.strength-1 { background-color: #ef4444; }
      &.strength-2 { background-color: #f59e0b; }
      &.strength-3 { background-color: #eab308; }
      &.strength-4 { background-color: #22c55e; }
      &.strength-5 { background-color: #16a34a; }
    }

    .strength-text {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .strength-label {
      font-size: 0.875rem;
      font-weight: 500;
      
      &.strength-0, &.strength-1 { color: #ef4444; }
      &.strength-2 { color: #f59e0b; }
      &.strength-3 { color: #eab308; }
      &.strength-4 { color: #22c55e; }
      &.strength-5 { color: #16a34a; }
    }

    .password-feedback {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 0.5rem;
      
      p {
        font-size: 0.875rem;
        font-weight: 500;
        color: #92400e;
        margin: 0 0 0.5rem 0;
      }
      
      ul {
        margin: 0;
        padding-left: 1.25rem;
        
        li {
          font-size: 0.875rem;
          color: #92400e;
          margin-bottom: 0.25rem;
        }
      }
    }

    /* Password Match Indicator */
    .password-match {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      
      &.match .match-text {
        color: #16a34a;
      }
      
      &.no-match .no-match-text {
        color: #ef4444;
      }
    }

    /* Security Options */
    .security-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      /* Mobile responsive security options */
      @media (max-width: 768px) {
        gap: 0.75rem;
      }
    }

    .security-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;

      /* Mobile responsive security options */
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;

        .option-control {
          margin-left: 0 !important;
          align-self: flex-end;
        }
      }
      
      .option-info {
        flex: 1;
        
        h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }
        
        p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
      }
      
      .option-control {
        flex-shrink: 0;
        margin-left: 1rem;
      }
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      
      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #d1d5db;
        transition: 0.3s;
        border-radius: 24px;
        
        &:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
      }
      
      input:checked + .toggle-slider {
        background-color: #4f46e5;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }
    }

    /* Security Select */
    .security-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: white;
      font-size: 0.875rem;
      color: #374151;
      min-width: 120px;
      
      &:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }
    }

    /* Verification Badge Styles */
    .verification-status {
      padding: 1.5rem;
      border-radius: 0.75rem;
      margin-top: 1rem;
      
      &.verified {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid #22c55e;
        display: flex;
        gap: 1rem;
        align-items: start;
        
        .status-icon {
          flex-shrink: 0;
        }
        
        .status-content {
          flex: 1;
          
          h5 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #166534;
            margin: 0 0 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          p {
            color: #15803d;
            margin: 0 0 1rem 0;
            font-size: 0.875rem;
          }
          
          .verified-benefits {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            
            .benefit-tag {
              background: white;
              color: #166534;
              padding: 0.375rem 0.75rem;
              border-radius: 1rem;
              font-size: 0.75rem;
              font-weight: 600;
              border: 1px solid #22c55e;
            }
          }
        }
      }
      
      &.not-verified {
        background: #f9fafb;
        border: 2px dashed #d1d5db;
        
        .status-content {
          h5 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
            margin: 0 0 0.5rem 0;
          }
          
          p {
            color: #6b7280;
            margin: 0 0 1rem 0;
          }
          
          .verification-benefits {
            list-style: none;
            padding: 0;
            margin: 0 0 1.5rem 0;
            
            li {
              color: #374151;
              padding: 0.5rem 0;
              font-size: 0.875rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
          }
          
          .verification-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            
            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
            }
          }
        }
      }
    }

    /* Account Activity */
    .activity-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      justify-content: center;
      color: #6b7280;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      
      .activity-icon {
        width: 32px;
        height: 32px;
        background-color: #e0e7ff;
        color: #4f46e5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .activity-details {
        flex: 1;
        
        .activity-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
          
          strong {
            font-weight: 600;
            color: #111827;
          }
          
          .activity-time {
            font-size: 0.875rem;
            color: #6b7280;
          }
        }
        
        .activity-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
      }
    }

    .activity-actions {
      display: flex;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Button Styles */
    .secondary-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background-color: #e5e7eb;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .danger-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: #fee2e2;
        border-color: #fca5a5;
      }
    }

    /* Enhanced Report User Styles */
    .report-guidelines {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      
      .guidelines-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        
        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #92400e;
          margin: 0;
        }
      }
      
      .guidelines-content {
        color: #92400e;
        
        p {
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        
        ul {
          margin: 1rem 0;
          padding-left: 1.25rem;
          
          li {
            margin-bottom: 0.5rem;
            line-height: 1.4;
          }
        }
        
        .warning-text {
          background: rgba(146, 64, 14, 0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
        }
      }
    }

    .report-step {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      
      .step-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        
        .step-number {
          width: 2rem;
          height: 2rem;
          background: #4f46e5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
      }
    }

    .search-input-wrapper {
      position: relative;
      
      .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
      }
      
      .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        }
      }
      
      .search-loading {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
      }
    }

    .selected-user {
      margin-top: 1rem;
      
      .selected-user-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #059669;
      }
    }

    .user-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s;
      
      &.clickable {
        cursor: pointer;
        
        &:hover {
          background-color: #f9fafb;
          border-color: #4f46e5;
        }
      }
      
      &.selected {
        background-color: #f0fdf4;
        border-color: #22c55e;
      }
      
      .user-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 1rem;
      }
      
      .user-info {
        flex: 1;
        
        strong {
          display: block;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        
        span {
          font-size: 0.875rem;
          color: #6b7280;
        }
      }
      
      .remove-selection {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #fee2e2;
        }
      }
    }

    .search-results {
      margin-top: 1rem;
      
      .results-header {
        padding: 0.5rem 0;
        font-size: 0.875rem;
        color: #6b7280;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 0.5rem;
      }
      
      .user-card + .user-card {
        margin-top: 0.5rem;
      }
    }

    .search-loading {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      
      .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      
      p {
        margin: 0.5rem 0;
        
        &:first-of-type {
          font-weight: 500;
          color: #374151;
        }
      }
    }

    .report-form {
      .report-select, .report-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        }
      }
      
      .character-count {
        text-align: right;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 0.5rem;
      }
    }

    .evidence-section {
      .evidence-upload {
        border: 2px dashed #d1d5db;
        border-radius: 0.5rem;
        padding: 2rem;
        text-align: center;
        background-color: #f9fafb;
        
        .upload-placeholder {
          color: #6b7280;
          
          p {
            margin: 0.5rem 0;
            
            &:first-of-type {
              font-weight: 500;
            }
          }
        }
      }
    }

    .report-summary {
      .summary-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        
        h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem 0;
        }
        
        .summary-item {
          display: flex;
          margin-bottom: 0.75rem;
          
          strong {
            min-width: 8rem;
            color: #475569;
            font-weight: 500;
          }
          
          span {
            color: #1e293b;
          }
        }
      }
      
      .submission-notice {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #fffbeb;
        border: 1px solid #fbbf24;
        border-radius: 0.5rem;
        
        div {
          p {
            margin: 0.25rem 0;
            color: #92400e;
            font-size: 0.875rem;
            
            &:first-child {
              font-weight: 600;
            }
          }
        }
      }
    }

    .submit-report-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background: #b91c1c;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    /* Notifications Section Styles */
    .notifications-section {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      .notifications-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 2rem;
        color: #6b7280;
        
        p {
          margin-top: 1rem;
          font-size: 1rem;
        }
      }

      .notifications-header {
        margin-bottom: 1.5rem;
        flex-shrink: 0;

        .header-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          align-items: center;

          /* Mobile responsive */
          @media (max-width: 768px) {
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
          }

          .refresh-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            color: #374151;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;

            &:hover:not(:disabled) {
              background: #e5e7eb;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }

          .mark-all-read-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
            transition: background-color 0.2s;

            &:hover {
              background: #4338ca;
            }
          }
        }
      }

      .notifications-content {
        flex: 1;
        min-height: 0;
        
        .notifications-scroll-container {
          max-height: calc(100vh - 400px);
          min-height: 300px;
          overflow-y: auto;
          padding-right: 0.5rem;
          
          /* Custom scrollbar styling */
          &::-webkit-scrollbar {
            width: 6px;
          }
          
          &::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          
          &::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
            
            &:hover {
              background: #94a3b8;
            }
          }
          
          /* Firefox scrollbar styling */
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;

          /* Mobile responsive */
          @media (max-width: 768px) {
            max-height: 500px;
            min-height: 250px;
            padding-right: 0.25rem;
          }
        }

        .empty-state {
          background: white;
          border-radius: 0.75rem;
          padding: 3rem 2rem;
          text-align: center;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          margin: 1rem 0;

          svg {
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          h4 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #374151;
            margin: 0 0 0.5rem 0;
          }

          p {
            margin: 0;
            font-size: 1rem;
          }
        }

        .notification-group {
          background: white;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

          &:last-child {
            margin-bottom: 0;
          }

          .group-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;

            /* Mobile responsive */
            @media (max-width: 768px) {
              padding: 0.75rem 1rem;
              flex-direction: column;
              gap: 0.25rem;
              align-items: flex-start;
            }

            h4 {
              font-size: 1rem;
              font-weight: 600;
              color: #111827;
              margin: 0;
            }

            .group-count {
              font-size: 0.875rem;
              color: #6b7280;
              font-weight: 500;
            }
          }

          .notification-list {
            .notification-item {
              display: flex;
              gap: 1rem;
              padding: 1rem 1.5rem;
              border-bottom: 1px solid #f3f4f6;
              cursor: pointer;
              transition: background-color 0.2s;
              position: relative;

              /* Mobile responsive */
              @media (max-width: 768px) {
                padding: 0.75rem 1rem;
                gap: 0.75rem;
              }

              &:last-child {
                border-bottom: none;
              }

              &:hover {
                background: #f9fafb;
              }

              &.unread {
                background: #fefbff;
                border-left: 3px solid #4f46e5;
              }

              .notification-icon {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                background: rgba(79, 70, 229, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                margin-top: 0.25rem;

                /* Mobile responsive */
                @media (max-width: 768px) {
                  width: 2rem;
                  height: 2rem;
                  
                  svg {
                    width: 16px;
                    height: 16px;
                  }
                }
              }

              .notification-content {
                flex: 1;
                min-width: 0;

                .notification-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 0.5rem;

                  /* Mobile responsive */
                  @media (max-width: 768px) {
                    flex-direction: column;
                    gap: 0.5rem;
                    align-items: flex-start;
                  }

                  h5 {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                    line-height: 1.4;

                    /* Mobile responsive */
                    @media (max-width: 768px) {
                      font-size: 0.8rem;
                    }
                  }

                  .notification-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-shrink: 0;
                    margin-left: 1rem;

                    /* Mobile responsive */
                    @media (max-width: 768px) {
                      margin-left: 0;
                      justify-content: space-between;
                      width: 100%;
                    }

                    .notification-time {
                      font-size: 0.75rem;
                      color: #9ca3af;
                      font-weight: 500;
                    }

                    .unread-indicator {
                      width: 0.5rem;
                      height: 0.5rem;
                      background: #4f46e5;
                      border-radius: 50%;
                    }

                    .delete-button {
                      background: none;
                      border: none;
                      color: #9ca3af;
                      cursor: pointer;
                      padding: 0.25rem;
                      border-radius: 0.25rem;
                      transition: all 0.2s;
                      opacity: 0;

                      &:hover {
                        color: #ef4444;
                        background: #fee2e2;
                      }

                      /* Mobile responsive - always show */
                      @media (max-width: 768px) {
                        opacity: 1 !important;
                      }
                    }
                  }
                }

                .notification-message {
                  color: #6b7280;
                  margin: 0 0 0.75rem 0;
                  line-height: 1.5;
                  font-size: 0.875rem;

                  /* Mobile responsive */
                  @media (max-width: 768px) {
                    font-size: 0.8rem;
                  }
                }

                .view-button {
                  display: inline-flex;
                  align-items: center;
                  gap: 0.375rem;
                  background: #4f46e5;
                  color: white;
                  border: none;
                  padding: 0.375rem 0.75rem;
                  border-radius: 0.375rem;
                  font-size: 0.75rem;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background-color 0.2s;

                  &:hover {
                    background: #4338ca;
                  }
                }
              }

              &:hover .delete-button {
                opacity: 1;
              }
            }
          }
        }
      }
    }

    /* Notifications Redirect Styles */
    .notifications-redirect {
      .redirect-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        
        .redirect-icon {
          margin-bottom: 1.5rem;
          color: #4f46e5;
          
          svg {
            opacity: 0.8;
          }
        }
        
        .redirect-content {
          h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0 0 0.75rem 0;
          }
          
          p {
            color: #6b7280;
            margin: 0 0 1.5rem 0;
            line-height: 1.6;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .redirect-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            
            &:hover {
              background: #4338ca;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
            }
          }
        }
      }
    }
    
    .notification-list {
        display: flex; flex-direction: column; gap: 1.5rem;

        /* Mobile responsive notification list */
        @media (max-width: 768px) {
          gap: 1rem;
        }
        .messages-scroll { max-height: 260px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0 0.25rem; }
        h4 {
            font-size: 1rem; font-weight: 700; color: #111827;
            padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;
            margin-bottom: 0;
            &.mt-8 { margin-top: 2rem; }
        }
        .notification-item {
            display: flex; 
        align-items: center;
        gap: 1rem; 
        padding: 1rem 0;

            /* Mobile responsive notification items */
            @media (max-width: 768px) {
              padding: 0.75rem 0;
              gap: 0.75rem;
            }
            .item-icon {
                width: 40px; height: 40px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; flex-shrink: 0;
                &.pending { background-color: #fef3c7; color: #92400e; }
                &.approved { background-color: #dbeafe; color: #1e40af; }
            }
            .item-avatar {
                width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
            }
            .item-content {
            flex-grow: 1;
                strong { font-weight: 600; color: #1f2937; }
                p { color: #6b7280; margin-top: 0.25rem; line-height: 1.5; }
            }
        }
      
      .delete-notification-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease-in-out;
        margin-left: auto;
        flex-shrink: 0;
      }
      .delete-notification-btn:hover {
        color: #ef4444;
        background-color: #fee2e2;
      }
    }
  }

  /* Animation keyframes */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;

export default Profile;