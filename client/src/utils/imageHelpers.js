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