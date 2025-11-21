import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: ${props => props.$objectFit || 'cover'};
  transition: opacity 0.3s ease;
  opacity: ${props => props.$loaded ? 1 : 0};
`;

const LoadingState = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  color: #9ca3af;
  
  .spinner {
    animation: spin 1s linear infinite;
    margin-bottom: 0.5rem;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  color: #9ca3af;
  text-align: center;
  padding: 1rem;
  
  svg {
    margin-bottom: 0.5rem;
  }
  
  .error-text {
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const QualityBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.3s ease;
`;

// In-memory cache for successfully loaded images
const imageCache = new Map();

// Load cached images from sessionStorage on mount
const loadCacheFromStorage = () => {
  try {
    const cached = sessionStorage.getItem('imageCache');
    if (cached) {
      const parsed = JSON.parse(cached);
      Object.entries(parsed).forEach(([key, value]) => {
        imageCache.set(key, value);
      });
    }
  } catch (err) {
    // Ignore cache load errors
  }
};

// Save cache to sessionStorage
const saveCacheToStorage = () => {
  try {
    const cacheObj = {};
    imageCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    sessionStorage.setItem('imageCache', JSON.stringify(cacheObj));
  } catch (err) {
    // Ignore cache save errors (e.g., quota exceeded)
  }
};

// Load cache on first import
loadCacheFromStorage();

const OptimizedImage = ({ 
  src, 
  alt, 
  fallbackSrc, 
  objectFit = 'cover',
  showQualityBadge = false,
  onLoad,
  onError,
  className,
  style,
  ...props 
}) => {
  // Check if image is already cached
  const cachedSrc = imageCache.get(src);
  const initialSrc = cachedSrc || src;
  
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [loaded, setLoaded] = useState(!!cachedSrc);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!cachedSrc);
  const [imageQuality, setImageQuality] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Reset states when src changes
  useEffect(() => {
    const cached = imageCache.get(src);
    if (cached) {
      // Use cached version immediately
      setCurrentSrc(cached);
      setLoaded(true);
      setError(false);
      setLoading(false);
    } else {
      setCurrentSrc(src);
      setLoaded(false);
      setError(false);
      setLoading(true);
      setImageQuality(null);
      setRetryCount(0);
    }
  }, [src]);

  // Optimize image URL for better quality and reliability
  const optimizeImageUrl = (url) => {
    if (!url) return url;
    
    // Skip optimization for placeholder images
    if (url.includes('placehold.co')) return url;
    
    // Google Books image optimization
    if (url.includes('books.google.com') || url.includes('googleusercontent.com')) {
      // Remove size restrictions and add high quality parameters
      let optimizedUrl = url.replace(/&zoom=\d+/, '&zoom=1');
      optimizedUrl = optimizedUrl.replace(/&w=\d+/, '');
      optimizedUrl = optimizedUrl.replace(/&h=\d+/, '');
      optimizedUrl = optimizedUrl.replace(/=s\d+-c/, '=s800-c'); // Increase size for Google user content
      
      // Add high quality parameters if not present
      if (!optimizedUrl.includes('fife=')) {
        optimizedUrl += optimizedUrl.includes('?') ? '&' : '?';
        optimizedUrl += 'fife=w800-h1200';
      }
      
      // Ensure HTTPS
      optimizedUrl = optimizedUrl.replace(/^http:/, 'https:');
      
      return optimizedUrl;
    }
    
    // Open Library image optimization
    if (url.includes('covers.openlibrary.org')) {
      // Use large size if not already specified
      let optimizedUrl = url;
      if (url.includes('-S.jpg')) {
        optimizedUrl = url.replace('-S.jpg', '-L.jpg');
      } else if (url.includes('-M.jpg')) {
        optimizedUrl = url.replace('-M.jpg', '-L.jpg');
      }
      // Ensure HTTPS
      optimizedUrl = optimizedUrl.replace(/^http:/, 'https:');
      return optimizedUrl;
    }
    
    // Cloudinary optimization (if using Cloudinary)
    if (url.includes('cloudinary.com')) {
      // Ensure proper transformations
      if (!url.includes('/upload/')) return url;
      
      const parts = url.split('/upload/');
      const transformations = 'f_auto,q_auto,w_800,h_1200,c_limit';
      return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }
    
    // Ensure HTTPS for all URLs
    return url.replace(/^http:/, 'https:');
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setLoaded(true);
    setLoading(false);
    setError(false);
    
    // Cache the successful image URL in memory
    imageCache.set(src, currentSrc);
    
    // Persist to sessionStorage for page reloads
    saveCacheToStorage();
    
    // Determine image quality based on dimensions
    const quality = img.naturalWidth > 400 ? 'HD' : img.naturalWidth > 200 ? 'Good' : 'Low';
    setImageQuality(quality);
    
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e) => {
    setLoading(false);
    
    // Don't retry if we're already using the fallback
    if (currentSrc === fallbackSrc || currentSrc.includes('placehold.co')) {
      setError(true);
      if (onError) onError(e);
      return;
    }
    
    // Try fallback source immediately if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setError(false);
      setLoading(true);
      setRetryCount(0);
      return;
    }
    
    // Only retry once with cache-busting for non-fallback images
    if (retryCount < 1 && !currentSrc.includes('retry=')) {
      setTimeout(() => {
        const separator = currentSrc.includes('?') ? '&' : '?';
        const newSrc = `${currentSrc}${separator}retry=1&t=${Date.now()}`;
        setCurrentSrc(newSrc);
        setRetryCount(1);
        setLoading(true);
        setError(false);
      }, 300);
      return;
    }
    
    setError(true);
    if (onError) onError(e);
  };

  const optimizedSrc = optimizeImageUrl(currentSrc);

  return (
    <ImageContainer className={className} style={style} {...props}>
      {optimizedSrc && !error && (
        <Image
          src={optimizedSrc}
          alt={alt}
          $objectFit={objectFit}
          $loaded={loaded}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {loading && !error && (
        <LoadingState>
          <ImageIcon className="spinner" size={24} />
        </LoadingState>
      )}
      
      {error && (
        <ErrorState>
          <AlertCircle size={32} />
          <div className="error-text">
            {alt ? `Failed to load ${alt}` : 'Image failed to load'}
          </div>
        </ErrorState>
      )}
      
      {showQualityBadge && imageQuality && loaded && (
        <QualityBadge $show={loaded}>
          {imageQuality}
        </QualityBadge>
      )}
    </ImageContainer>
  );
};

export default OptimizedImage;