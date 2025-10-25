import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, usersAPI } from '../utils/api';
import { ensureLocalKeypairAndUpload } from '../utils/crypto';
import { getCurrentLocation } from '../utils/locationHelpers';
import avatarCache from '../utils/avatarCache';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);
  
  const fetchProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      
      // Preload avatar image for faster display using cache
      if (data.avatar) {
        avatarCache.preload(data.avatar).catch(() => {
          // Silently handle preload errors
        });
      }
      
      // server returns flat user fields; normalize to `user` shape
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        location: data.location,
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('token', data.token);
      // fetch latest profile to populate navbar/profile
      await fetchProfile();
      // Ensure E2EE key pair exists and public key is uploaded
      try { await ensureLocalKeypairAndUpload(usersAPI); } catch {}
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed.');
      throw error;
    }
  };

  const register = async (userData) => {
     try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('token', data.token);
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
      toast.success("Location updated successfully!");
    } catch (error) {
      console.log("Could not get user location:", error.message);
      // Don't show error toast for location - it's optional
    }
  };

  const logout = () => {
      localStorage.removeItem('token');
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