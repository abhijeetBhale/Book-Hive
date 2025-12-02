/**
 * Event filtering utilities for role-based access control
 */

/**
 * Filter events based on user role
 * Organizers can only see their own events
 * Users and admins can see all published events
 */
export const filterEventsByRole = (events, user) => {
  if (!user) {
    // Public access - only published events
    return events.filter(event => event.status === 'published' && event.isPublic);
  }

  // Admin can see all events
  if (user.role === 'admin' || user.role === 'superadmin') {
    return events;
  }

  // Organizer can only see their own events
  if (user.role === 'organizer') {
    return events.filter(event => 
      event.organizer.toString() === user._id.toString()
    );
  }

  // Regular users see only published public events
  return events.filter(event => event.status === 'published' && event.isPublic);
};

/**
 * Sanitize event data based on user role
 * Remove sensitive information that shouldn't be exposed
 */
export const sanitizeEventForRole = (event, user) => {
  const eventObj = event.toObject ? event.toObject() : { ...event };

  // Public users get basic info only
  if (!user) {
    delete eventObj.contactEmail;
    delete eventObj.contactPhone;
    delete eventObj.rejectionReason;
    delete eventObj.verifiedBy;
    return eventObj;
  }

  // Admin sees everything
  if (user.role === 'admin' || user.role === 'superadmin') {
    return eventObj;
  }

  // Organizer sees their own events fully
  if (user.role === 'organizer' && eventObj.organizer.toString() === user._id.toString()) {
    return eventObj;
  }

  // Regular users get public info
  delete eventObj.rejectionReason;
  delete eventObj.verifiedBy;
  
  return eventObj;
};

/**
 * Check if user can access a specific event
 */
export const canAccessEvent = (event, user) => {
  // Public published events are accessible to all
  if (event.status === 'published' && event.isPublic) {
    return true;
  }

  // No user - can't access non-public events
  if (!user) {
    return false;
  }

  // Admin can access all events
  if (user.role === 'admin' || user.role === 'superadmin') {
    return true;
  }

  // Organizer can access their own events
  if (user.role === 'organizer' && event.organizer.toString() === user._id.toString()) {
    return true;
  }

  // User can access published public events
  if (event.status === 'published' && event.isPublic) {
    return true;
  }

  return false;
};

/**
 * Build query filter for events based on user role
 */
export const buildEventQuery = (user, additionalFilters = {}) => {
  const query = { ...additionalFilters };

  // No user - only published public events
  if (!user) {
    query.status = 'published';
    query.isPublic = true;
    return query;
  }

  // Admin sees all
  if (user.role === 'admin' || user.role === 'superadmin') {
    return query;
  }

  // For public events endpoint, everyone sees published/completed public events
  // Don't filter by organizer for public events
  if (!query.organizer) {
    // If status is not already set, show published and completed events
    if (!query.status) {
      query.status = { $in: ['published', 'completed'] };
    }
    query.isPublic = true;
  }

  return query;
};

/**
 * Sanitize registrant data for organizer view
 * Only show data with user consent
 */
export const sanitizeRegistrantData = (registration) => {
  const regObj = registration.toObject ? registration.toObject() : { ...registration };

  // Only return user snapshot if consent was given
  if (!regObj.consentGiven) {
    return {
      _id: regObj._id,
      status: regObj.status,
      registeredAt: regObj.registeredAt,
      consentGiven: false,
      userSnapshot: {
        name: 'Anonymous User',
        email: 'consent-not-given@example.com',
        phone: ''
      }
    };
  }

  return regObj;
};
