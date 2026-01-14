import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const verificationPromptAPI = axios.create({
  baseURL: `${API_URL}/users/verification-prompt`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
verificationPromptAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get verification prompt status
export const getVerificationPromptStatus = async () => {
  try {
    const response = await verificationPromptAPI.get('/status');
    return response.data;
  } catch (error) {
    console.error('Get verification prompt status error:', error);
    throw error;
  }
};

// Mark floating popup as seen (temporary dismiss with X)
export const markFloatingPopupSeen = async () => {
  try {
    const response = await verificationPromptAPI.post('/seen');
    return response.data;
  } catch (error) {
    console.error('Mark floating popup seen error:', error);
    throw error;
  }
};

// Permanently dismiss verification prompt (Don't show again)
export const dismissPermanently = async () => {
  try {
    const response = await verificationPromptAPI.post('/dismiss-permanently');
    return response.data;
  } catch (error) {
    console.error('Dismiss permanently error:', error);
    throw error;
  }
};

// Mark profile setup as completed
export const markProfileSetupCompleted = async () => {
  try {
    const response = await verificationPromptAPI.post('/profile-setup-completed');
    return response.data;
  } catch (error) {
    console.error('Mark profile setup completed error:', error);
    throw error;
  }
};

// Reset floating popup flag (for next login)
export const resetFloatingPopupFlag = async () => {
  try {
    const response = await verificationPromptAPI.post('/reset-popup');
    return response.data;
  } catch (error) {
    console.error('Reset floating popup flag error:', error);
    throw error;
  }
};

export default {
  getVerificationPromptStatus,
  markFloatingPopupSeen,
  dismissPermanently,
  markProfileSetupCompleted,
  resetFloatingPopupFlag
};