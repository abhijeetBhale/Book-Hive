/**
 * Server Wakeup Utility
 * Handles Render free tier cold starts by pinging the server before making actual requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const HEALTH_CHECK_URL = API_BASE_URL.replace('/api', '') + '/api/health';

let isServerAwake = false;
let wakeupPromise = null;

/**
 * Check if server is awake
 */
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
    
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
      return true;
    }
    return false;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
};

/**
 * Wake up the server if it's sleeping (cold start)
 * Returns a promise that resolves when server is ready
 */
export const wakeupServer = async () => {
  // If already awake, return immediately
  if (isServerAwake) {
    return true;
  }
  
  // If wakeup is in progress, return the existing promise
  if (wakeupPromise) {
    return wakeupPromise;
  }
  
  console.log('🔄 Waking up server (this may take 30-60 seconds on first load)...');
  
  wakeupPromise = checkServerHealth()
    .then(success => {
      wakeupPromise = null;
      if (success) {
        console.log('✅ Server is awake and ready!');
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
