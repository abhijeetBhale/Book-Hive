const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

class AdminNotificationAPI {
  // Get all notifications with filtering and pagination
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_URL}/admin/notifications?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    return response.json();
  }

  // Get notification counts by category
  async getNotificationCounts() {
    const response = await fetch(`${API_URL}/admin/notifications/counts`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notification counts: ${response.statusText}`);
    }

    return response.json();
  }

  // Get notification statistics
  async getNotificationStats(period = '7d') {
    const response = await fetch(`${API_URL}/admin/notifications/stats?period=${period}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notification stats: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark specific notification as read
  async markAsRead(notificationId) {
    const response = await fetch(`${API_URL}/admin/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark all notifications in category as read
  async markCategoryAsRead(category) {
    const response = await fetch(`${API_URL}/admin/notifications/category/${category}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to mark category as read: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await fetch(`${API_URL}/admin/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete specific notification
  async deleteNotification(notificationId) {
    const response = await fetch(`${API_URL}/admin/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }

    return response.json();
  }

  // Bulk operations on notifications
  async bulkOperation(action, options = {}) {
    const response = await fetch(`${API_URL}/admin/notifications/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to perform bulk operation: ${response.statusText}`);
    }

    return response.json();
  }

  // Create test notification (for development)
  async createTestNotification(notificationData = {}) {
    const response = await fetch(`${API_URL}/admin/notifications/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create test notification: ${response.statusText}`);
    }

    return response.json();
  }
}

export default new AdminNotificationAPI();