import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const versionNotificationAPI = axios.create({
  baseURL: `${API_URL}/version-notifications`,
});

// Add auth token to requests
versionNotificationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
versionNotificationAPI.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const versionNotificationService = {
  // Get unviewed notifications for current user
  getUnviewedNotifications: () => versionNotificationAPI.get('/unviewed'),

  // Get notification details by ID
  getNotificationById: (id) => versionNotificationAPI.get(`/${id}`),

  // Mark notification as viewed/dismissed/closed
  markAsViewed: (id, action = 'viewed') => 
    versionNotificationAPI.post(`/${id}/view`, { action }),

  // Admin functions
  admin: {
    // Create new version notification
    createNotification: (data) => versionNotificationAPI.post('/', data),

    // Get all notifications
    getAllNotifications: (params = {}) => 
      versionNotificationAPI.get('/admin/all', { params }),

    // Update notification
    updateNotification: (id, data) => versionNotificationAPI.put(`/${id}`, data),

    // Delete notification
    deleteNotification: (id) => versionNotificationAPI.delete(`/${id}`)
  }
};

export default versionNotificationService;