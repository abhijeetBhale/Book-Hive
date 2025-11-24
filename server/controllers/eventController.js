import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import User from '../models/User.js';
import { buildEventQuery, canAccessEvent, sanitizeEventForRole, sanitizeRegistrantData } from '../utils/eventFilters.js';

/**
 * @desc    Get all public events with filters
 * @route   GET /api/events
 * @access  Public
 */
export const getPublicEvents = async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 50, // Default 50km radius
      startDate,
      endDate,
      eventType,
      tags,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (page - 1) * limit;

    // If location parameters are provided, use aggregation pipeline with $geoNear
    if (lat && lng) {
      const radiusInMeters = radius * 1000;
      
      // Build match conditions for aggregation
      const matchConditions = {
        status: 'published',
        isPublic: true
      };

      // Date filters
      if (startDate) {
        matchConditions.startAt = { $gte: new Date(startDate) };
      }
      if (endDate) {
        matchConditions.endAt = { $lte: new Date(endDate) };
      }

      // Event type filter
      if (eventType) {
        matchConditions.eventType = eventType;
      }

      // Tags filter
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        matchConditions.tags = { $in: tagArray };
      }

      // Search filter
      if (search) {
        matchConditions.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Use aggregation pipeline with $geoNear
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: matchConditions
          }
        },
        {
          $sort: { startAt: 1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        },
        {
          $lookup: {
            from: 'users',
            localField: 'organizer',
            foreignField: '_id',
            as: 'organizer'
          }
        },
        {
          $unwind: '$organizer'
        },
        {
          $project: {
            'organizer.password': 0,
            'organizer.email': 0,
            'organizer.__v': 0
          }
        }
      ];

      const events = await Event.aggregate(pipeline);

      // Count total for pagination (without skip/limit)
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: matchConditions
          }
        },
        {
          $count: 'total'
        }
      ];

      const countResult = await Event.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Sanitize events based on user role
      const sanitizedEvents = events.map(event => sanitizeEventForRole(event, req.user));

      res.json({
        success: true,
        data: sanitizedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // No location filtering - use regular find query
      const query = buildEventQuery(req.user, {
        status: 'published',
        isPublic: true
      });

      // Date filters
      if (startDate) {
        query.startAt = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query.endAt = { $lte: new Date(endDate) };
      }

      // Event type filter
      if (eventType) {
        query.eventType = eventType;
      }

      // Tags filter
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const events = await Event.find(query)
        .populate('organizer', 'name avatar organizerProfile')
        .sort({ startAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Event.countDocuments(query);

      // Sanitize events based on user role
      const sanitizedEvents = events.map(event => sanitizeEventForRole(event, req.user));

      res.json({
        success: true,
        data: sanitizedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch events',
      error: error.message 
    });
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar email organizerProfile');

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    // Check access permission
    if (!canAccessEvent(event, req.user)) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to view this event' 
      });
    }

    // Increment view count
    event.views += 1;
    await event.save();

    // Sanitize event data
    const sanitizedEvent = sanitizeEventForRole(event, req.user);

    res.json({
      success: true,
      data: sanitizedEvent
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch event',
      error: error.message 
    });
  }
};

/**
 * @desc    Register for an event
 * @route   POST /api/events/:id/register
 * @access  Private
 */
export const registerForEvent = async (req, res) => {
  try {
    const { phone, consentGiven } = req.body;
    const eventId = req.params.id;
    const userId = req.user._id;

    // Validate consent
    if (!consentGiven) {
      return res.status(400).json({ 
        success: false,
        message: 'You must consent to share your contact information with the organizer' 
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    // Check if event is published
    if (event.status !== 'published') {
      return res.status(400).json({ 
        success: false,
        message: 'This event is not available for registration' 
      });
    }

    // Check if event has capacity
    if (event.capacity > 0 && event.currentRegistrations >= event.capacity) {
      return res.status(400).json({ 
        success: false,
        message: 'This event is full' 
      });
    }

    // Check if user already registered
    const existingRegistration = await EventRegistration.findOne({
      event: eventId,
      user: userId
    });

    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        // Reactivate cancelled registration
        existingRegistration.status = 'registered';
        existingRegistration.registeredAt = new Date();
        existingRegistration.cancelledAt = null;
        await existingRegistration.save();

        return res.json({
          success: true,
          message: 'Successfully re-registered for event',
          data: existingRegistration
        });
      }

      return res.status(400).json({ 
        success: false,
        message: 'You are already registered for this event' 
      });
    }

    // Create registration
    const registration = await EventRegistration.create({
      event: eventId,
      user: userId,
      userSnapshot: {
        name: req.user.name,
        email: req.user.email,
        phone: phone || ''
      },
      consentGiven: true,
      status: 'registered'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: registration
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to register for event',
      error: error.message 
    });
  }
};

/**
 * @desc    Cancel event registration
 * @route   DELETE /api/events/:id/register
 * @access  Private
 */
export const cancelRegistration = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const registration = await EventRegistration.findOne({
      event: eventId,
      user: userId,
      status: 'registered'
    });

    if (!registration) {
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found' 
      });
    }

    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to cancel registration',
      error: error.message 
    });
  }
};

/**
 * @desc    Get user's registered events
 * @route   GET /api/events/my-registrations
 * @access  Private
 */
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({
      user: req.user._id,
      status: { $ne: 'cancelled' }
    })
      .populate({
        path: 'event',
        populate: {
          path: 'organizer',
          select: 'name avatar organizerProfile'
        }
      })
      .sort({ registeredAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message 
    });
  }
};

export default {
  getPublicEvents,
  getEventById,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations
};
