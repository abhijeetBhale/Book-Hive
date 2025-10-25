import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import avatarCache from '../../utils/avatarCache';

const OptimizedAvatar = ({
    src,
    alt,
    name,
    size = 'md',
    className = '',
    showOnlineStatus = false,
    isOnline = false
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageSrc, setImageSrc] = useState(src);

    // Size configurations
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24'
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 32,
        xl: 48
    };

    // Generate fallback avatar URL
    const getFallbackAvatar = (name) => {
        if (!name) return '';
        const initials = name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=400&background=4F46E5&color=fff&bold=true`;
    };

    // Update image source when src prop changes
    useEffect(() => {
        if (src && src !== imageSrc) {
            setImageLoaded(false);
            setImageError(false);
            setImageSrc(src);
        }
    }, [src]);

    // Preload image with caching
    useEffect(() => {
        if (imageSrc) {
            // Check if image is already cached
            if (avatarCache.isCached(imageSrc)) {
                setImageLoaded(true);
                setImageError(false);
                return;
            }

            // Preload image using cache
            avatarCache.preload(imageSrc)
                .then(() => {
                    setImageLoaded(true);
                    setImageError(false);
                })
                .catch(() => {
                    setImageError(true);
                    setImageLoaded(false);
                    // Try fallback avatar
                    const fallback = getFallbackAvatar(name);
                    if (fallback && imageSrc !== fallback) {
                        setImageSrc(fallback);
                    }
                });
        }
    }, [imageSrc, name]);

    const handleImageError = () => {
        if (!imageError) {
            setImageError(true);
            const fallback = getFallbackAvatar(name);
            if (fallback && imageSrc !== fallback) {
                setImageSrc(fallback);
            }
        }
    };

    return (
        <div className={`relative ${sizeClasses[size]} ${className}`}>
            {/* Loading placeholder */}
            {!imageLoaded && !imageError && (
                <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}>
                    <User size={iconSizes[size]} className="text-gray-400" />
                </div>
            )}

            {/* Avatar image */}
            {imageSrc && (
                <img
                    src={imageSrc}
                    alt={alt || name || 'Avatar'}
                    className={`${sizeClasses[size]} rounded-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                        }`}
                    onLoad={() => {
                        setImageLoaded(true);
                        setImageError(false);
                    }}
                    onError={handleImageError}
                    loading="eager" // Load immediately for better UX
                />
            )}

            {/* Fallback icon if no image */}
            {imageError && !imageSrc && (
                <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center`}>
                    <User size={iconSizes[size]} className="text-gray-600" />
                </div>
            )}

            {/* Online status indicator */}
            {showOnlineStatus && (
                <span
                    className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                />
            )}
        </div>
    );
};

export default OptimizedAvatar;