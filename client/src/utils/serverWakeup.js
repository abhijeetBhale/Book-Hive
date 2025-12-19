/**
 * Server Wakeup Utility
 * Handles Render free tier cold starts by pinging the server before making actual requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const HEALTH_CHECK_URL = API_BASE_URL.replace('/api', '') + '/api/health';

let isServerAwake = false;
let wakeupPromise = null;

// Cache server status in localStorage for faster subsequent loads
const SERVER_STATUS_KEY = 'serverStatus';
const SERVER_STATUS_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached server status
 */
const getCachedServerStatus = () => {
  try {
    const cached = localStorage.getItem(SERVER_STATUS_KEY);
    if (cached) {
      const { timestamp, isAwake } = JSON.parse(cached);
      if (Date.now() - timestamp < SERVER_STATUS_EXPIRY) {
        return isAwake;
      }
    }
  } catch (error) {
    // Ignore cache errors
  }
  return null;
};

/**
 * Cache server status
 */
const setCachedServerStatus = (isAwake) => {
  try {
    localStorage.setItem(SERVER_STATUS_KEY, JSON.stringify({
      timestamp: Date.now(),
      isAwake
    }));
  } catch (error) {
    // Ignore cache errors
  }
};

/**
 * Check if server is awake
 */
export const checkServerHealth = async () => {
  try {
    // Check cache first for faster response
    const cachedStatus = getCachedServerStatus();
    if (cachedStatus === true) {
      isServerAwake = true;
      return true;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Reduced to 30 seconds
    
    const response = await fetch(HEALTH_CHECK_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      isServerAwake = true;
      setCachedServerStatus(true);
      return true;
    }
    setCachedServerStatus(false);
    return false;
  } catch (error) {
    console.error('Health check failed:', error.message);
    setCachedServerStatus(false);
    return false;
  }
};

/**
 * Wake up the server if it's sleeping (cold start)
 * Returns a promise that resolves when server is ready
 */
export const wakeupServer = async () => {
  // Check cache first for instant response
  const cachedStatus = getCachedServerStatus();
  if (cachedStatus === true) {
    isServerAwake = true;
    return true;
  }

  // If already awake, return immediately
  if (isServerAwake) {
    return true;
  }
  
  // If wakeup is in progress, return the existing promise
  if (wakeupPromise) {
    return wakeupPromise;
  }
  
  console.log('🔄 Waking up server...');
  
  wakeupPromise = checkServerHealth()
    .then(success => {
      wakeupPromise = null;
      if (success) {
        console.log('✅ Server is ready!');
      } else {
        console.warn('⚠️ Server health check failed, but continuing anyway...');
      }
      return success;
    })
    .catch(error => {
      wakeupPromise = null;
      console.error('❌ Server wakeup failed:', error);
      return false;
    });
  
  return wakeupPromise;
};

/**
 * Reset server awake status (useful for testing or after long idle periods)
 */
export const resetServerStatus = () => {
  isServerAwake = false;
  wakeupPromise = null;
};

/**
 * Get current server status
 */
export const getServerStatus = () => ({
  isAwake: isServerAwake,
  isWakingUp: !!wakeupPromise,
});

export default {
  checkServerHealth,
  wakeupServer,
  resetServerStatus,
  getServerStatus,
};
