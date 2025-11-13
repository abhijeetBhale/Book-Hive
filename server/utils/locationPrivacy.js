/**
 * Location Privacy Utilities
 * Adds random offset to coordinates to protect user privacy
 */

/**
 * Adds a random offset to coordinates for privacy
 * Offset range: approximately 200-400 meters (0.002-0.004 degrees)
 * 
 * @param {number} latitude - Original latitude
 * @param {number} longitude - Original longitude
 * @returns {object} - Object with offsetLat and offsetLng
 */
export const addPrivacyOffset = (latitude, longitude) => {
  // Generate random offset between 0.002 and 0.004 degrees
  // This translates to approximately 200-400 meters
  const minOffset = 0.002;
  const maxOffset = 0.004;
  
  // Random offset for latitude (can be positive or negative)
  const latOffset = (Math.random() * (maxOffset - minOffset) + minOffset) * (Math.random() > 0.5 ? 1 : -1);
  
  // Random offset for longitude (can be positive or negative)
  const lngOffset = (Math.random() * (maxOffset - minOffset) + minOffset) * (Math.random() > 0.5 ? 1 : -1);
  
  return {
    latitude: latitude + latOffset,
    longitude: longitude + lngOffset
  };
};

/**
 * Calculate the actual distance between two points considering privacy offset
 * This gives users an approximate distance, not exact
 * 
 * @param {array} coords1 - [longitude, latitude]
 * @param {array} coords2 - [longitude, latitude]
 * @returns {number} - Distance in kilometers (rounded)
 */
export const calculateApproximateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
    return null;
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place for privacy
  return Math.round(distance * 10) / 10;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Generate a consistent offset for a user based on their ID
 * This ensures the same user always gets the same offset
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {number} latitude - Original latitude
 * @param {number} longitude - Original longitude
 * @returns {object} - Object with offsetLat and offsetLng
 */
export const getConsistentPrivacyOffset = (userId, latitude, longitude) => {
  // Use user ID to generate a consistent but unpredictable offset
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate pseudo-random offset based on user ID
  const random1 = Math.sin(seed) * 10000;
  const random2 = Math.cos(seed) * 10000;
  
  const latOffset = ((random1 - Math.floor(random1)) * 0.002 + 0.002) * (random1 > 0 ? 1 : -1);
  const lngOffset = ((random2 - Math.floor(random2)) * 0.002 + 0.002) * (random2 > 0 ? 1 : -1);
  
  return {
    latitude: latitude + latOffset,
    longitude: longitude + lngOffset
  };
};
