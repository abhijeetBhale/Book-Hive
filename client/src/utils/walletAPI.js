import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const walletAPIInstance = axios.create({
  baseURL: `${API_URL}/wallet`,
});

// Add auth token to requests
walletAPIInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
walletAPIInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const walletAPI = {
  // Get wallet details
  getWalletDetails: (params = {}) => walletAPIInstance.get('/', { params }),

  // Get transaction history
  getTransactionHistory: (params = {}) => walletAPIInstance.get('/transactions', { params }),

  // Get earnings summary
  getEarningsSummary: () => walletAPIInstance.get('/earnings'),

  // Request withdrawal
  requestWithdrawal: (data) => walletAPIInstance.post('/withdraw', data),

  // Admin endpoints
  admin: {
    // Get platform wallet summary
    getPlatformSummary: () => walletAPIInstance.get('/platform-summary'),

    // Get withdrawal requests
    getWithdrawalRequests: (params = {}) => walletAPIInstance.get('/withdrawal-requests', { params }),

    // Process withdrawal request
    processWithdrawalRequest: (id, data) => walletAPIInstance.put(`/withdrawal-requests/${id}`, data),
  }
};

export default walletAPI;