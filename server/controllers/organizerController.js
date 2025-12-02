import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import OrganizerApplication from '../models/OrganizerApplication.js';
import User from '../models/User.js';
import { sanitizeRegistrantData } from '../utils/eventFilters.js';

/**
 * @desc    Get organizer's events
 * @route   GET /api/organizer/events
 * @access  Private (Organizer)
 */
export const getOrganizerEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { organizer: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch events',
      error: error.message 
    });
  }
};

/**
 * @desc    Get organizer's events for map view
 * @route   GET /api/organizer/events/map
 * @access  Private (Organizer)
 */
export const getOrganizerEventsForMap = async (req, res) => {
  try {
    const events = await Event.find({
      organizer: req.user._id,
      status: 'published'
    }).select('title startAt endAt location address status currentRegistrations capacity');

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get organizer events for map error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch events for map',
      error: error.message 
    });
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/organizer/events
 * @access  Private (Organizer)
 */
export const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    const event = await Event.create(eventData);
    
    // Populate organizer for admin notification
    await event.populate('organizer', 'name');

    // Notify admins of new event
    try {
      const adminNotificationService = req.app.get('adminNotificationService');
      if (adminNotificationService) {
        adminNotificationService.notifyNewEvent(event);
      }
    } catch (adminNotifError) {
      console.error('Failed to send admin notification for new event:', adminNotifError);
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create event',
      error: error.message 
    });
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/organizer/events/:id
 * @access  Private (Organizer)
 */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found or you do not have permission to edit it' 
      });
    }

    // Update fields with proper handling
    const updateData = { ...req.body };
    delete updateData.organizer; // Prevent changing organizer

    // Handle location update properly
    if (updateData.location) {
      // Ensure location has the correct structure
      if (!updateData.location.type) {
        updateData.location.type = 'Point';
      }
      // Ensure coordinates are numbers
      if (updateData.location.coordinates) {
        updateData.location.coordinates = updateData.location.coordinates.map(coord => 
          typeof coord === 'string' ? parseFloat(coord) : coord
        );
      }
    }

    // Handle registrationFields - ensure it's an array
    if (updateData.registrationFields && !Array.isArray(updateData.registrationFields)) {
      updateData.registrationFields = [];
    }

    // Update the event
    Object.keys(updateData).forEach(key => {
      event[key] = updateData[key];
    });

    console.log('Saving event update:', event.title);
    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update event',
      error: error.message 
    });
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/organizer/events/:id
 * @access  Private (Organizer)
 */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found or you do not have permission to delete it' 
      });
    }

    // Check if event has registrations
    const registrationCount = await EventRegistration.countDocuments({
      event: event._id,
      status: 'registered'
    });

    if (registrationCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete event with active registrations. Please cancel the event instead.' 
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete event',
      error: error.message 
    });
  }
};

/**
 * @desc    Get event registrants
 * @route   GET /api/organizer/events/:id/registrants
 * @access  Private (Organizer)
 */
export const getEventRegistrants = async (req, res) => {
  try {
    // Verify event belongs to organizer
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found or you do not have permission to view registrants' 
      });
    }

    const { status, page = 1, limit = 50 } = req.query;
    
    const query = { event: req.params.id };
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const registrations = await EventRegistration.find(query)
      .populate('user', 'name avatar')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EventRegistration.countDocuments(query);

    // Sanitize registrant data (only show data with consent)
    const sanitizedRegistrations = registrations.map(reg => sanitizeRegistrantData(reg));

    res.json({
      success: true,
      data: sanitizedRegistrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get event registrants error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch registrants',
      error: error.message 
    });
  }
};

/**
 * @desc    Export registrants as CSV
 * @route   GET /api/organizer/events/:id/export
 * @access  Private (Organizer)
 */
export const exportRegistrants = async (req, res) => {
  try {
    // Verify event belongs to organizer
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found or you do not have permission to export registrants' 
      });
    }

    const registrations = await EventRegistration.find({
      event: req.params.id,
      status: { $ne: 'cancelled' }
    }).sort({ registeredAt: 1 });

    // Build CSV
    const csvRows = [];
    csvRows.push(['Name', 'Email', 'Phone', 'Status', 'Registered At', 'Consent Given'].join(','));

    registrations.forEach(reg => {
      if (reg.consentGiven) {
        csvRows.push([
          `"${reg.userSnapshot.name}"`,
          `"${reg.userSnapshot.email}"`,
          `"${reg.userSnapshot.phone || 'N/A'}"`,
          reg.status,
          new Date(reg.registeredAt).toLocaleString(),
          'Yes'
        ].join(','));
      }
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="event-${event._id}-registrants.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export registrants error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to export registrants',
      error: error.message 
    });
  }
};

/**
 * @desc    Update registrant status (mark as attended, etc.)
 * @route   PUT /api/organizer/events/:eventId/registrants/:registrationId
 * @access  Private (Organizer)
 */
export const updateRegistrantStatus = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { status, organizerNotes } = req.body;

    // Verify event belongs to organizer
    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found or you do not have permission' 
      });
    }

    const registration = await EventRegistration.findOne({
      _id: registrationId,
      event: eventId
    });

    if (!registration) {
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found' 
      });
    }

    if (status) {
      registration.status = status;
      if (status === 'attended') {
        registration.attendedAt = new Date();
      }
    }

    if (organizerNotes !== undefined) {
      registration.organizerNotes = organizerNotes;
    }

    await registration.save();

    res.json({
      success: true,
      message: 'Registrant status updated successfully',
      data: sanitizeRegistrantData(registration)
    });
  } catch (error) {
    console.error('Update registrant status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update registrant status',
      error: error.message 
    });
  }
};

/**
 * @desc    Apply to become an organizer
 * @route   POST /api/organizer/apply
 * @access  Private
 */
export const applyAsOrganizer = async (req, res) => {
  try {
    // Check if user already has an application
    const existingApplication = await OrganizerApplication.findOne({
      user: req.user._id
    });

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return res.status(400).json({ 
          success: false,
          message: 'You already have a pending application' 
        });
      }
      if (existingApplication.status === 'approved') {
        return res.status(400).json({ 
          success: false,
          message: 'You are already an approved organizer' 
        });
      }
    }

    const applicationData = {
      user: req.user._id,
      ...req.body
    };

    const application = await OrganizerApplication.create(applicationData);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. We will review it shortly.',
      data: application
    });
  } catch (error) {
    console.error('Apply as organizer error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application',
      error: error.message 
    });
  }
};

/**
 * @desc    Get organizer dashboard stats
 * @route   GET /api/organizer/stats
 * @access  Private (Organizer)
 */
export const getOrganizerStats = async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Total events
    const totalEvents = await Event.countDocuments({ organizer: organizerId });

    // Published events
    const publishedEvents = await Event.countDocuments({ 
      organizer: organizerId, 
      status: 'published' 
    });

    // Upcoming events
    const upcomingEvents = await Event.countDocuments({
      organizer: organizerId,
      status: 'published',
      startAt: { $gte: new Date() }
    });

    // Total registrations across all events
    const events = await Event.find({ organizer: organizerId }).select('_id');
    const eventIds = events.map(e => e._id);
    
    const totalRegistrations = await EventRegistration.countDocuments({
      event: { $in: eventIds },
      status: 'registered'
    });

    // Total views
    const eventsWithViews = await Event.find({ organizer: organizerId }).select('views');
    const totalViews = eventsWithViews.reduce((sum, event) => sum + event.views, 0);

    res.json({
      success: true,
      data: {
        totalEvents,
        publishedEvents,
        upcomingEvents,
        totalRegistrations,
        totalViews
      }
    });
  } catch (error) {
    console.error('Get organizer stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch stats',
      error: error.message 
    });
  }
};

export default {
  getOrganizerEvents,
  getOrganizerEventsForMap,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrants,
  exportRegistrants,
  updateRegistrantStatus,
  applyAsOrganizer,
  getOrganizerStats
};
