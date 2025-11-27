import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, usersAPI } from '../utils/api';
import { ensureLocalKeypairAndUpload } from '../utils/crypto';
import { getCurrentLocation } from '../utils/locationHelpers';
import avatarCache from '../utils/avatarCache';
import sessionManager from '../utils/sessionManager';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionManager.getToken();
    if (token && sessionManager.isTokenValid()) {
      // Try to load cached user data first for instant display
      const cachedUser = localStorage.getItem('cachedUser');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          setLoading(false); // Show UI immediately with cached data
          
          // Fetch fresh data in background
          fetchProfile(true); // Pass true to indicate background refresh
        } catch (error) {
          // If cache is corrupted, fetch normally
          fetchProfile();
        }
      } else {
        fetchProfile();
      }
    } else {
      if (token) {
        // Token exists but is invalid/expired
        sessionManager.removeToken();
        localStorage.removeItem('cachedUser');
      }
      setLoading(false);
    }

    // Listen for session expiration events
    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem('cachedUser');
      toast.error('Your session has expired. Please login again.');
      navigate('/login');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [navigate]);
  
  const fetchProfile = async (isBackgroundRefresh = false) => {
    try {
      const token = sessionManager.getToken();
      if (!token) {
        if (!isBackgroundRefresh) {
          setLoading(false);
        }
        return;
      }

      const { data } = await authAPI.getProfile();
      
      // Preload avatar image for faster display using cache
      if (data.avatar) {
        avatarCache.preload(data.avatar).catch(() => {
          // Silently handle preload errors
        });
      }
      
      // server returns flat user fields; normalize to `user` shape
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        location: data.location,
        role: data.role || 'user', // Include role for admin access checks
        isOrganizer: data.isOrganizer || false, // Include organizer flag
        verified: data.verified || false, // Include verified status for organizer checks
        organizerProfile: data.organizerProfile || null, // Include organizer profile
      };
      
      setUser(userData);
      
      // Cache user data for faster subsequent loads
      try {
        localStorage.setItem('cachedUser', JSON.stringify(userData));
      } catch (cacheError) {
        // Ignore cache errors (e.g., quota exceeded)
        console.warn('Failed to cache user data:', cacheError);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      
      // If it's a background refresh and fails, keep the cached data
      if (isBackgroundRefresh) {
        console.log('Background refresh failed, keeping cached data');
        return;
      }
      
      if (error?.response?.status === 401) {
        sessionManager.removeToken();
        localStorage.removeItem('cachedUser');
        setUser(null);
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Timeout error - show cached data if available
        const cachedUser = localStorage.getItem('cachedUser');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
            toast.error('Slow connection detected. Showing cached data.');
          } catch (e) {
            // Cache corrupted
            localStorage.removeItem('cachedUser');
          }
        }
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      sessionManager.setToken(data.token);
      // fetch latest profile to populate navbar/profile
      await fetchProfile();
      // Ensure E2EE key pair exists and public key is uploaded
      try { await ensureLocalKeypairAndUpload(usersAPI); } catch {}
      toast.success('Login successful!');
      
      // Redirect to the page user was trying to access, or home
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed.');
      throw error;
    }
  };

  const register = async (userData) => {
     try {
      const { data } = await authAPI.register(userData);
      sessionManager.setToken(data.token);
      await fetchProfile();
      // Automatically request location after successful registration
      await requestUserLocation();
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
      throw error;
    }
  };

  const requestUserLocation = async () => {
    try {
      const location = await getCurrentLocation();
      await authAPI.updateLocation(location);
      // Only show location toast for manual registration, not Google auth
      if (window.location.pathname !== '/auth/callback') {
        toast.success("Location updated successfully!");
      }
    } catch (error) {
      // Location update failed - optional feature
    }
  };

  const logout = () => {
      sessionManager.removeToken();
      localStorage.removeItem('cachedUser');
      setUser(null);
      toast.success('Logged out successfully.');
      navigate('/login');
  };

  const value = { user, setUser, login, register, logout, loading, fetchProfile };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};