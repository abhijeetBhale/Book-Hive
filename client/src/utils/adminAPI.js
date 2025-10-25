import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
});

// Add auth token to requests
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Redirect to home if not authorized
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const adminAPIService = {
  // Dashboard
  getDashboard: () => adminAPI.get('/dashboard'),
  getAnalytics: (period = '30d') => adminAPI.get(`/analytics?period=${period}`),
  getBookSharingActivity: (period = 'monthly') => adminAPI.get(`/book-sharing-activity?period=${period}`),
  getTopCategories: () => adminAPI.get('/top-categories'),

  // User Management
  getUsers: (params = {}) => adminAPI.get('/users', { params }),
  getUserDetails: (id) => adminAPI.get(`/users/${id}`),
  updateUser: (id, data) => adminAPI.put(`/users/${id}`, data),

  // Book Management
  getBooks: (params = {}) => adminAPI.get('/books', { params }),
  getBooksForSale: (params = {}) => adminAPI.get('/books-for-sale', { params }),
  deleteBook: (id) => adminAPI.delete(`/books/${id}`),

  // Borrow Requests Management
  getBorrowRequests: (params = {}) => adminAPI.get('/borrow-requests', { params }),
  updateBorrowRequest: (id, data) => adminAPI.put(`/borrow-requests/${id}`, data),

  // Book Clubs Management
  getBookClubs: (params = {}) => adminAPI.get('/book-clubs', { params }),
  updateBookClub: (id, data) => adminAPI.put(`/book-clubs/${id}`, data),
  deleteBookClub: (id) => adminAPI.delete(`/book-clubs/${id}`),

  // Reports Management
  getReports: (params = {}) => adminAPI.get('/reports', { params }),
  updateReport: (id, data) => adminAPI.put(`/reports/${id}`, data),
  takeReportAction: (id, action, actionData) => adminAPI.put(`/reports/${id}`, { 
    status: 'resolved', 
    action, 
    actionData 
  }),
};

export default adminAPIService;