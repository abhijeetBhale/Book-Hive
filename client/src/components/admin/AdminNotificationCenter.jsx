import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  Filter, 
  Calendar,
  User,
  BookOpen,
  ShoppingCart,
  Users,
  AlertTriangle,
  DollarSign,
  Star,
  Settings,
  RefreshCw,
  Search,
  ArrowLeftRight,
  Eye,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminNotificationAPI from '../../utils/adminNotificationAPI.js';

const AdminNotificationCenter = ({ isOpen, onClose, onNotificationCountChange, onNavigateToTab }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'all',
    priority: 'all',
    isRead: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Category icons mapping
  const getCategoryIcon = (category) => {
    const iconMap = {
      'users': Users,
      'books': BookOpen,
      'books-for-sale': ShoppingCart,
      'borrows': ArrowLeftRight,
      'clubs': Users,
      'organizer-applications': User,
      'events': Calendar,
      'verification': CheckCircle,
      'reviews': Star,
      'reports': AlertTriangle,
      'wallet-management': DollarSign,
      'lending-fees': DollarSign,
      'system': Settings
    };
    return iconMap[category] || Bell;
  };

  // Priority colors
  const getPriorityColor = (priority) => {
    const colorMap = {
      'low': 'text-gray-500 bg-gray-100',
      'medium': 'text-blue-500 bg-blue-100',
      'high': 'text-orange-500 bg-orange-100',
      'urgent': 'text-red-500 bg-red-100'
    };
    return colorMap[priority] || 'text-gray-500 bg-gray-100';
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        sortBy,
        sortOrder
      };

      // Remove 'all' values
      Object.keys(params).forEach(key => {
        if (params[key] === 'all' || params[key] === '') {
          delete params[key];
        }
      });

      const response = await adminNotificationAPI.getNotifications(params);
      const data = response.data;

      setNotifications(data.notifications || []);
      setPagination(data.pagination || pagination);
      setTotalUnread(data.summary?.totalUnread || 0);

      // Notify parent component of count change
      if (onNotificationCountChange) {
        onNotificationCountChange(data.summary?.totalUnread || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, sortBy, sortOrder, onNotificationCountChange]);

  // Fetch notification counts
  const fetchNotificationCounts = useCallback(async () => {
    try {
      const response = await adminNotificationAPI.getNotificationCounts();
      const data = response.data;
      
      setTotalUnread(data.totalUnread || 0);

      if (onNotificationCountChange) {
        onNotificationCountChange(data.totalUnread || 0);
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [onNotificationCountChange]);

  // Initial load and refresh when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchNotificationCounts(); // Refresh counts when opening
    }
  }, [isOpen, fetchNotifications, fetchNotificationCounts]);

  // View notification - navigate to relevant tab
  const viewNotification = (notification) => {
    // Map notification categories to admin dashboard tabs
    const categoryToTabMap = {
      'users': 'users',
      'books': 'books',
      'books-for-sale': 'books-for-sale',
      'borrows': 'borrows',
      'clubs': 'clubs',
      'organizer-applications': 'organizer-applications',
      'events': 'events',
      'verification': 'verification',
      'reviews': 'reviews',
      'reports': 'reports',
      'wallet-management': 'wallet-management',
      'lending-fees': 'lending-fees',
      'system': 'settings'
    };

    const targetTab = categoryToTabMap[notification.category];
    
    if (targetTab && onNavigateToTab) {
      // Mark as read when viewing
      markAsRead(notification._id);
      
      // Show loading toast
      const loadingToast = toast.loading(`Navigating to ${notification.category.replace('-', ' ')} section...`);
      
      // Navigate to the relevant tab
      setTimeout(() => {
        onNavigateToTab(targetTab);
        
        // Close the notification center
        onClose();
        
        // Dismiss loading and show success
        toast.dismiss(loadingToast);
        toast.success(`Opened ${notification.category.replace('-', ' ')} section`, { icon: '✅' });
      }, 500);
    } else {
      toast.error('Unable to navigate to this section');
    }
  };
  const markAsRead = async (notificationId) => {
    try {
      await adminNotificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      
      // Refresh counts
      fetchNotificationCounts();
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await adminNotificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      
      // Reset counts
      setTotalUnread(0);
      
      if (onNotificationCountChange) {
        onNotificationCountChange(0);
      }
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await adminNotificationAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Refresh counts
      fetchNotificationCounts();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Bulk operations
  const handleBulkOperation = async (action) => {
    if (selectedNotifications.size === 0) {
      toast.error('Please select notifications first');
      return;
    }

    try {
      const notificationIds = Array.from(selectedNotifications);
      await adminNotificationAPI.bulkOperation(action, { notificationIds });
      
      // Update local state based on action
      if (action === 'markAsRead') {
        setNotifications(prev => 
          prev.map(notif => 
            selectedNotifications.has(notif._id)
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
      } else if (action === 'delete') {
        setNotifications(prev => 
          prev.filter(notif => !selectedNotifications.has(notif._id))
        );
      }
      
      setSelectedNotifications(new Set());
      fetchNotificationCounts();
      toast.success(`Bulk ${action} completed`);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Select all notifications
  const selectAllNotifications = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n._id)));
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Notifications</h2>
              <p className="text-sm text-gray-500">
                {totalUnread > 0 ? `${totalUnread} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchNotifications}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {totalUnread > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark All Read
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="users">Users</option>
                  <option value="books">Books</option>
                  <option value="books-for-sale">Books for Sale</option>
                  <option value="borrows">Borrow Requests</option>
                  <option value="clubs">Book Clubs</option>
                  <option value="organizer-applications">Organizer Applications</option>
                  <option value="events">Events</option>
                  <option value="verification">Verification</option>
                  <option value="reviews">Reviews</option>
                  <option value="reports">Reports</option>
                  <option value="wallet-management">Wallet Management</option>
                  <option value="lending-fees">Lending Fees</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.isRead}
                  onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="false">Unread</option>
                  <option value="true">Read</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkOperation('markAsRead')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => handleBulkOperation('delete')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500 text-center">
                {Object.values(filters).some(f => f !== 'all' && f !== '') 
                  ? 'Try adjusting your filters to see more notifications.'
                  : 'You\'re all caught up! New notifications will appear here.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Select All Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                    onChange={selectAllNotifications}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select all ({notifications.length})
                  </span>
                </label>
              </div>

              {notifications.map((notification) => {
                const IconComponent = getCategoryIcon(notification.category);
                const isSelected = selectedNotifications.has(notification._id);
                
                return (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    } ${isSelected ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleNotificationSelection(notification._id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getPriorityColor(notification.priority)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`mt-1 text-sm ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {notification.category.replace('-', ' ')}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewNotification(notification)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                              title="View in relevant section"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} notifications
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationCenter;