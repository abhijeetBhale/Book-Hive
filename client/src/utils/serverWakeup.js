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
    const timeoutId = setTimeout(() => {
      controller.abort('Health check timeout');
    }, 15000); // Reduced to 15 seconds
    
    const response = await fetch(HEALTH_CHECK_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache busting to prevent cached responses
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server health check passed:', data);
      isServerAwake = true;
      setCachedServerStatus(true);
      return true;
    } else {
      console.warn('⚠️ Server health check failed with status:', response.status);
      setCachedServerStatus(false);
      return false;
    }
  } catch (error) {
    // Handle different types of errors more gracefully
    if (error.name === 'AbortError') {
      console.warn('⚠️ Health check timed out - server may be starting up');
    } else if (error.message.includes('Failed to fetch')) {
      console.warn('⚠️ Network error during health check - server may not be ready');
    } else {
      console.error('❌ Health check failed:', error.message);
    }
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
  
  console.log('🔄 Checking server status...');
  
  wakeupPromise = (async () => {
    // For local development, skip health check and assume server is ready
    if (API_BASE_URL.includes('localhost')) {
      console.log('✅ Local development detected - skipping health check');
      isServerAwake = true;
      setCachedServerStatus(true);
      wakeupPromise = null;
      return true;
    }
    
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Health check attempt ${attempts}/${maxAttempts}...`);
      
      const success = await checkServerHealth();
      
      if (success) {
        console.log('✅ Server is ready!');
        wakeupPromise = null;
        return true;
      }
      
      // Wait before retrying (except on last attempt)
      if (attempts < maxAttempts) {
        console.log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // If all attempts failed, still continue but log warning
    console.warn('⚠️ Server health check failed after all attempts, but continuing anyway...');
    wakeupPromise = null;
    return false;
  })();
  
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
