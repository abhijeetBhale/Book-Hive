/**
 * Format last seen time into human-readable format
 * @param {string|Date} lastSeenDate - The last seen date
 * @returns {string} - Formatted string like "Active 2 mins ago", "Active 2 days ago"
 */
export const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return 'Last seen unknown';
  
  const now = new Date();
  const diffMs = now - new Date(lastSeenDate);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  // Handle very recent activity (less than 2 minutes)
  if (diffMinutes < 2) {
    return 'Active just now';
  } 
  // Handle recent activity (2-59 minutes)
  else if (diffMinutes < 60) {
    return `Active ${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} ago`;
  } 
  // Handle hourly activity (1-23 hours)
  else if (diffHours < 24) {
    return `Active ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } 
  // Handle daily activity (1-6 days)
  else if (diffDays < 7) {
    return `Active ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  // Handle weekly activity (1-4 weeks)
  else if (diffWeeks < 4) {
    return `Active ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  // Handle monthly activity (1+ months)
  else if (diffMonths < 12) {
    return `Active ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  }
  // Handle very old activity (1+ years)
  else {
    const diffYears = Math.floor(diffDays / 365);
    return `Active ${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
};

/**
 * Check if a user should be considered "recently active" (within last 5 minutes)
 * @param {string|Date} lastSeenDate - The last seen date
 * @returns {boolean} - True if recently active
 */
export const isRecentlyActive = (lastSeenDate) => {
  if (!lastSeenDate) return false;
  
  const now = new Date();
  const diffMs = now - new Date(lastSeenDate);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return diffMinutes < 5;
};

/**
 * Get a shorter version of last seen for compact displays
 * @param {string|Date} lastSeenDate - The last seen date
 * @returns {string} - Formatted string like "2m ago", "2h ago", "2d ago"
 */
export const formatLastSeenShort = (lastSeenDate) => {
  if (!lastSeenDate) return 'Unknown';
  
  const now = new Date();
  const diffMs = now - new Date(lastSeenDate);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMinutes < 2) {
    return 'Now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  }
};