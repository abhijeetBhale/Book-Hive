/**
 * Process Google profile photo URL to get higher quality image
 * @param {Array} photos - Array of photo objects from Google profile
 * @returns {string} - Processed avatar URL or empty string
 */
export const processGoogleAvatar = (photos) => {
  if (!photos || photos.length === 0) {
    return '';
  }

  let avatarUrl = photos[0].value;
  
  // Google profile photos come with size parameters like s96-c, s50-c etc.
  // We can modify these to get higher quality images
  if (avatarUrl.includes('googleusercontent.com')) {
    // Replace any existing size parameter with s200-c for 200px image (good balance of quality and speed)
    avatarUrl = avatarUrl.replace(/s\d+-c/, 's200-c');
    
    // If no size parameter exists, add one
    if (!avatarUrl.includes('s200-c')) {
      // Add size parameter before any existing query parameters
      const urlParts = avatarUrl.split('?');
      if (urlParts.length > 1) {
        avatarUrl = `${urlParts[0]}=s200-c&${urlParts[1]}`;
      } else {
        avatarUrl = `${avatarUrl}=s200-c`;
      }
    }
    
    // Add cache-friendly parameters to improve loading speed
    if (!avatarUrl.includes('cache=')) {
      avatarUrl += avatarUrl.includes('?') ? '&cache=1' : '?cache=1';
    }
  }

  return avatarUrl;
};

/**
 * Get default avatar URL if user doesn't have one
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {string} - Default avatar URL
 */
export const getDefaultAvatar = (name, email) => {
  // Use a service like UI Avatars or Gravatar as fallback
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // UI Avatars service - generates avatar with initials
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=400&background=4F46E5&color=ffffff&bold=true`;
};

/**
 * Validate if avatar URL is accessible
 * @param {string} url - Avatar URL to validate
 * @returns {Promise<boolean>} - True if URL is accessible
 */
export const validateAvatarUrl = async (url) => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.log('Avatar URL validation failed:', error.message);
    return false;
  }
};