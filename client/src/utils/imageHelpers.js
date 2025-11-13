/**
 * Utility functions for handling images throughout the application
 */

// Get environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_ASSET_URL = API_URL;

/**
 * Returns a properly formatted image URL based on the path provided
 * Handles different types of image paths consistently across the application
 * 
 * @param {string} path - The image path to format
 * @param {string} placeholderUrl - Optional custom placeholder URL
 * @returns {string} - The properly formatted image URL
 */
export const getFullImageUrl = (path, placeholderUrl = 'https://placehold.co/300x450/e2e8f0/64748b?text=No+Cover') => {
  // If path is null, undefined or empty string, return placeholder
  if (!path) return placeholderUrl;
  
  // If path already starts with http/https, it's already a full URL (Cloudinary URLs)
  if (path.startsWith('http')) return path;
  
  // If path is a blob URL (for local file previews), return as is
  if (path.startsWith('blob:')) return path;
  
  // If path starts with a slash, append to base URL
  if (path.startsWith('/')) return `${BASE_ASSET_URL}${path}`;
  
  // For other paths (likely relative paths from server), ensure proper formatting
  return `${BASE_ASSET_URL}/${path.replace(/\\/g, '/')}`;
};

/**
 * Creates an object URL for a file (typically from a file input)
 * 
 * @param {File} file - The file to create an object URL for
 * @returns {string} - The object URL
 */
export const createObjectURL = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};

/**
 * Revokes an object URL to free up memory
 * 
 * @param {string} url - The object URL to revoke
 */
export const revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Image cache to store successfully loaded images
 */
const imageCache = new Map();

/**
 * Preload an image and cache it
 * 
 * @param {string} src - The image URL to preload
 * @returns {Promise} - Resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    // Check if already cached
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, true);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload multiple images
 * 
 * @param {string[]} urls - Array of image URLs to preload
 * @returns {Promise} - Resolves when all images are loaded
 */
export const preloadImages = (urls) => {
  return Promise.allSettled(urls.map(url => preloadImage(url)));
};

/**
 * Check if an image is cached
 * 
 * @param {string} src - The image URL to check
 * @returns {boolean} - True if cached
 */
export const isImageCached = (src) => {
  return imageCache.has(src);
};

/**
 * Clear the image cache
 */
export const clearImageCache = () => {
  imageCache.clear();
};