import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { MapPin, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { getCurrentLocation } from '../utils/locationHelpers';
import toast from 'react-hot-toast';

const LocationPermission = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const { fetchProfile } = useContext(AuthContext);

  const handleAllowLocation = async () => {
    setLoading(true);
    try {
      // Get real-time location from browser
      const location = await getCurrentLocation();
      // Send location to backend
      await authAPI.updateLocation(location);
      // Refresh user profile in context
      await fetchProfile();
      toast.success("Location updated successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message || "Unable to get your location. Please try again or set it manually in your profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="icon-container">
            <MapPin size={48} />
          </div>
          
          <h2>Enable Location Access</h2>
          <p>
            To connect you with nearby readers and show relevant books in your area, 
            we'd like to access your location. Your exact address is never shared with other users.
          </p>
          
          <div className="button-group">
            <button 
              className="allow-btn" 
              onClick={handleAllowLocation}
              disabled={loading}
            >
              {loading ? "Fetching location..." : "Allow Location"}
            </button>
            <button className="skip-btn" onClick={onClose}>
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: #f3f4f6;
    }
  }

  .icon-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
    color: #4F46E5;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
  }

  p {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .allow-btn {
    background-color: #4F46E5;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background-color: #4338CA;
    }

    &:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  }

  .skip-btn {
    background: none;
    border: 1px solid #d1d5db;
    color: #6b7280;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
  }
`;

export default LocationPermission;