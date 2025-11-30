import React, { useEffect, useContext, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import styled from 'styled-components';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchProfile } = useContext(AuthContext);
  const hasProcessed = useRef(false); // Use ref to prevent duplicate execution

  useEffect(() => {
    const token = searchParams.get('token');

    const handleAuth = async () => {
      // Prevent duplicate execution
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      if (token) {
        try {
          // Import session manager
          const { default: sessionManager } = await import('../utils/sessionManager');

          // 1. Save the token received from the backend
          sessionManager.setToken(token);
          
          // 2. Refresh the user's profile to update the app's state
          await fetchProfile();
          
          // 3. Automatically request user's location for Google auth users (silently)
          await requestUserLocation();
          
          // 4. Show single success toast for Google login
          toast.success("Welcome to BookHive! You're now logged in.", {
            id: 'google-login-success', // Unique ID prevents duplicate toasts
            duration: 3000,
          });
          
          // 5. Redirect to the homepage, now logged in
          navigate('/', { replace: true });
        } catch (error) {
          console.error('Auth callback error:', error);
          toast.error("Login failed. Please try again.", {
            id: 'google-login-error',
          });
          navigate('/login', { replace: true });
        }
      } else {
        // Handle cases where the redirect happens without a token
        navigate('/login', { replace: true });
      }
    };

    const requestUserLocation = async () => {
      if (!navigator.geolocation) {
        return;
      }

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        await authAPI.updateLocation(location);
      } catch (error) {
        // Location update failed - optional feature, fail silently
      }
    };

    handleAuth();
  }, []); // Empty dependency array - only run once on mount

  return (
    <StyledWrapper>
      <Loader className="animate-spin" />
      <p>Finalizing your login...</p>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 1rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;

  .animate-spin {
    width: 3rem;
    height: 3rem;
    color: #4F46E5;
  }
`;

export default AuthCallback;