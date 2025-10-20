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
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageQuality, setImageQuality] = useState(null);

  // Reset states when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setLoaded(false);
    setError(false);
    setLoading(true);
    setImageQuality(null);
  }, [src]);

  // Optimize image URL for better quality
  const optimizeImageUrl = (url) => {
    if (!url) return url;
    
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
      
      return optimizedUrl;
    }
    
    // Open Library image optimization
    if (url.includes('covers.openlibrary.org')) {
      // Use large size if not already specified
      if (url.includes('-S.jpg')) {
        return url.replace('-S.jpg', '-L.jpg');
      }
      if (url.includes('-M.jpg')) {
        return url.replace('-M.jpg', '-L.jpg');
      }
    }
    
    return url;
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setLoaded(true);
    setLoading(false);
    setError(false);
    
    // Determine image quality based on dimensions
    const quality = img.naturalWidth > 400 ? 'HD' : img.naturalWidth > 200 ? 'Good' : 'Low';
    setImageQuality(quality);
    
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e) => {
    setLoading(false);
    
    // Try fallback source if available and not already tried
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setError(false);
      setLoading(true);
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