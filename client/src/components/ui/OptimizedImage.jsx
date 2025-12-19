import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  placeholder = '/placeholder-book.png',
  lazy = true,
  quality = 80,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, isInView]);

  // Optimize image URL (you can integrate with image CDN services here)
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc || originalSrc.includes('placeholder')) {
      return originalSrc;
    }

    // If using a CDN like Cloudinary, you can add transformations here
    // Example: return `${originalSrc}?w=${width}&h=${height}&q=${quality}&f=auto`;
    
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  const imageSrc = isInView ? getOptimizedSrc(src) : placeholder;

  return (
    <ImageContainer 
      ref={imgRef} 
      className={className}
      width={width}
      height={height}
      {...props}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && !isError && (
        <PlaceholderDiv width={width} height={height}>
          <LoadingSpinner />
        </PlaceholderDiv>
      )}
      
      {/* Actual image */}
      {isInView && (
        <StyledImage
          src={isError ? placeholder : imageSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          isLoaded={isLoaded}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}
    </ImageContainer>
  );
};

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  overflow: hidden;
  width: ${props => props.width ? `${props.width}px` : 'auto'};
  height: ${props => props.height ? `${props.height}px` : 'auto'};
`;

const PlaceholderDiv = styled.div`
  width: ${props => props.width ? `${props.width}px` : '100%'};
  height: ${props => props.height ? `${props.height}px` : '200px'};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: ${props => props.isLoaded ? 1 : 0};
  position: ${props => props.isLoaded ? 'static' : 'absolute'};
  top: 0;
  left: 0;
`;

export default OptimizedImage;