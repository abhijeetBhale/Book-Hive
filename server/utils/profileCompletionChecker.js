/**
 * Profile Completion Checker
 * Determines if a user has completed their profile setup
 * 
 * For BookHive, a complete profile requires:
 * 1. Name (required at registration)
 * 2. Email (required at registration)
 * 3. Avatar/Profile Picture
 * 4. Location set (not default 0,0)
 * 5. At least 1 book added to their library
 */

export const isProfileComplete = (user) => {
  // Check if user object exists
  if (!user) return false;

  // 1. Name - should always exist (required at registration)
  const hasName = !!(user.name && user.name.trim().length > 0);

  // 2. Email - should always exist (required at registration)
  const hasEmail = !!(user.email && user.email.trim().length > 0);

  // 3. Avatar - user should have uploaded a profile picture
  const hasAvatar = !!(user.avatar && user.avatar.trim().length > 0);

  // 4. Location - user should have set their location (not default 0,0)
  const hasLocation = !!(
    user.location &&
    user.location.coordinates &&
    user.location.coordinates.length === 2 &&
    (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)
  );

  // 5. Books - user should have added at least 1 book
  const hasBooks = !!(user.booksOwned && user.booksOwned.length > 0);

  // Profile is complete if ALL essential requirements are met
  const isComplete = hasName && hasEmail && hasAvatar && hasLocation && hasBooks;

  // Return detailed status
  return {
    isComplete,
    completionPercentage: calculateCompletionPercentage({
      hasName,
      hasEmail,
      hasAvatar,
      hasLocation,
      hasBooks
    }),
    missingFields: getMissingFields({
      hasName,
      hasEmail,
      hasAvatar,
      hasLocation,
      hasBooks
    }),
    checklist: {
      hasName,
      hasEmail,
      hasAvatar,
      hasLocation,
      hasBooks
    }
  };
};

/**
 * Calculate profile completion percentage
 */
const calculateCompletionPercentage = (checklist) => {
  const fields = Object.values(checklist);
  const completedFields = fields.filter(field => field === true).length;
  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Get list of missing fields with user-friendly names
 */
const getMissingFields = (checklist) => {
  const fieldNames = {
    hasName: 'Name',
    hasEmail: 'Email',
    hasAvatar: 'Profile Picture',
    hasLocation: 'Location',
    hasBooks: 'At least 1 book in library'
  };

  const missing = [];
  for (const [key, value] of Object.entries(checklist)) {
    if (!value) {
      missing.push(fieldNames[key]);
    }
  }

  return missing;
};

/**
 * Get user-friendly message about profile completion
 */
export const getProfileCompletionMessage = (user) => {
  const status = isProfileComplete(user);

  if (status.isComplete) {
    return {
      message: 'Your profile is complete! 🎉',
      type: 'success'
    };
  }

  const missingCount = status.missingFields.length;
  const missingList = status.missingFields.join(', ');

  return {
    message: `Complete your profile to unlock all features. Missing: ${missingList}`,
    type: 'warning',
    missingFields: status.missingFields,
    completionPercentage: status.completionPercentage
  };
};

export default {
  isProfileComplete,
  getProfileCompletionMessage
};
