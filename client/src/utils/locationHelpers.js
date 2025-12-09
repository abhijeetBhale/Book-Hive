/**
 * Check if user has a valid location set
 * @param {Object} user - User object with location data
 * @returns {boolean} - True if user has valid location, false otherwise
 */
export const hasValidLocation = (user) => {
  if (!user || !user.location || !user.location.coordinates) {
    return false;
  }
  
  const [lng, lat] = user.location.coordinates;
  // Check if coordinates are not default (0, 0) and are valid numbers
  return lng !== 0 && lat !== 0 && !isNaN(lng) && !isNaN(lat);
};

/**
 * Request user's current location using browser geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<{latitude: number, longitude: number}>} - Promise resolving to coordinates
 */
export const getCurrentLocation = (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coords1 - [longitude, latitude] of first point
 * @param {Array} coords2 - [longitude, latitude] of second point
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) {
    return null;
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) {
    return 'Distance unknown';
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  
  return `${distance}km away`;
};

/**
 * Show location warning modal for users without location
 * @param {string} userName - Name of the user without location
 */
export const showLocationWarning = (userName) => {
  // Dispatch custom event that components can listen to
  window.dispatchEvent(new CustomEvent('show-location-warning', {
    detail: { userName }
  }));
};
