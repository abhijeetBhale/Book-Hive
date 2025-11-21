import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getFullImageUrl } from '../utils/imageHelpers';

// Cache for avatar images
const avatarCache = new Map();

// Load cache from sessionStorage
const loadAvatarCache = () => {
  try {
    const cached = sessionStorage.getItem('avatarCache');
    if (cached) {
      const parsed = JSON.parse(cached);
      Object.entries(parsed).forEach(([key, value]) => {
        avatarCache.set(key, value);
      });
    }
  } catch (err) {
    // Ignore cache errors
  }
};

// Save cache to sessionStorage
const saveAvatarCache = () => {
  try {
    const cacheObj = {};
    avatarCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    sessionStorage.setItem('avatarCache', JSON.stringify(cacheObj));
  } catch (err) {
    // Ignore cache errors
  }
};

// Load cache on first import
loadAvatarCache();

const AvatarContainer = styled.div`
  position: relative;
  display: inline-block;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${props => props.$rounded ? '50%' : '0'};
    transition: opacity 0.3s ease;
  }
  
  .avatar-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: ${props => props.$rounded ? '50%' : '0'};
  }
  
  .avatar-error {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: ${props => props.$size ? `${props.$size * 0.4}px` : '1rem'};
  }
`;

const OptimizedAvatar = ({ 
  src, 
  alt = 'User', 
  size = 40, 
  rounded = true,
  className = '',
  fallbackColor = '#667eea'
}) => {
  // Check cache first
  const cachedSrc = src ? avatarCache.get(src) : null;
  const [imageSrc, setImageSrc] = useState(cachedSrc);
  const [loading, setLoading] = useState(!cachedSrc);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef(null);
  const maxRetries = 1;

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate fallback avatar URL
  const getFallbackUrl = (name) => {
    const initials = getInitials(name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${fallbackColor.replace('#', '')}&color=fff&size=${size * 2}&bold=true`;
  };

  useEffect(() => {
    if (!src) {
      setImageSrc(getFallbackUrl(alt));
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = avatarCache.get(src);
    if (cached) {
      setImageSrc(cached);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    // Process the image URL to get full path
    const processedSrc = getFullImageUrl(src);

    // Create a new image to preload
    const img = new Image();
    
    // Add cache-busting only on retry
    const imageUrl = retryCount > 0 ? `${processedSrc}?retry=${retryCount}&t=${Date.now()}` : processedSrc;
    
    img.onload = () => {
      setImageSrc(imageUrl);
      setLoading(false);
      setError(false);
      // Cache successful load
      avatarCache.set(src, imageUrl);
      saveAvatarCache();
    };

    img.onerror = () => {
      if (retryCount < maxRetries) {
        // Retry after a short delay
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 300);
      } else {
        // Use fallback after max retries
        const fallbackUrl = getFallbackUrl(alt);
        setImageSrc(fallbackUrl);
        setLoading(false);
        setError(true);
        // Cache the fallback
        avatarCache.set(src, fallbackUrl);
        saveAvatarCache();
      }
    };

    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, alt, retryCount, size, fallbackColor]);

  return (
    <AvatarContainer 
      $rounded={rounded} 
      $size={size}
      className={className}
      style={{ width: size, height: size }}
    >
      {loading && (
        <div className="avatar-loading">
          <div style={{ 
            width: size * 0.5, 
            height: size * 0.5, 
            border: '2px solid #e5e7eb',
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      )}
      {!loading && imageSrc && (
        <img 
          ref={imgRef}
          src={imageSrc} 
          alt={alt}
          loading="lazy"
          style={{ opacity: loading ? 0 : 1 }}
        />
      )}
      {!loading && !imageSrc && (
        <div className="avatar-loading avatar-error">
          {getInitials(alt)}
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AvatarContainer>
  );
};

export default OptimizedAvatar;
