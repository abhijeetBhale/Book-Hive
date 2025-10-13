import ClubEvent from '../models/ClubEvent.js';
import ClubMembership from '../models/ClubMembership.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get club events
// @route   GET /api/clubs/:clubId/events
// @access  Public (for public clubs) / Private (for private clubs)
export const getClubEvents = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    eventType,
    status = 'scheduled',
    upcoming = false,
    sortBy = 'eventDate',
    sortOrder = 'asc'
  } = req.query;

  // Check if user has access to club events
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user?._id,
    status: 'active'
  });

  // For private clubs, user must be a member
  const BookClub = (await import('../models/BookClub.js')).default;
  const club = await BookClub.findById(req.params.clubId);
  if (club?.privacy === 'private' && !membership) {
    return next(new AppError('You must be a member to view events', 403));
  }

  // Build query
  let query = { club: req.params.clubId };
  
  if (eventType) {
    query.eventType = eventType;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (upcoming === 'true') {
    query.eventDate = { $gte: new Date() };
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const events = await ClubEvent.find(query)
    .populate('organizer', 'name avatar')
    .populate('relatedBook', 'title author coverImage')
    .populate('attendees.user', 'name avatar')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await ClubEvent.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single event
// @route   GET /api/clubs/:clubId/events/:eventId
// @access  Public/Private
export const getClubEvent = catchAsync(async (req, res, next) => {
  const event = await ClubEvent.findById(req.params.eventId)
    .populate('organizer', 'name avatar location')
    .populate('relatedBook', 'title author coverImage description')
    .populate('attendees.user', 'name avatar')
    .populate('agenda.presenter', 'name avatar')
    .lean();

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check access permissions
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user?._id,
    status: 'active'
  });

  const BookClub = (await import('../models/BookClub.js')).default;
  const club = await BookClub.findById(req.params.clubId);
  if (club?.privacy === 'private' && !membership) {
    return next(new AppError('You must be a member to view this event', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

// @desc    Create club event
// @route   POST /api/clubs/:clubId/events
// @access  Private (Members only)
export const createClubEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    eventType,
    eventDate,
    duration,
    location,
    maxAttendees,
    relatedBook,
    agenda,
    resources,
    isRecurring,
    recurrence
  } = req.body;

  // Check if user is a member
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to create events', 403));
  }

  // Check if club allows events
  const BookClub = (await import('../models/BookClub.js')).default;
  const club = await BookClub.findById(req.params.clubId);
  if (!club.settings.allowEvents) {
    return next(new AppError('Events are not allowed in this club', 403));
  }

  // Only admins/moderators can create events (configurable)
  if (!['admin', 'moderator'].includes(membership.role)) {
    return next(new AppError('Only admins and moderators can create events', 403));
  }

  const event = await ClubEvent.create({
    club: req.params.clubId,
    organizer: req.user._id,
    title,
    description,
    eventType,
    eventDate,
    duration,
    location,
    maxAttendees,
    relatedBook,
    agenda,
    resources,
    isRecurring,
    recurrence
  });

  await event.populate('organizer', 'name avatar');
  if (relatedBook) {
    await event.populate('relatedBook', 'title author coverImage');
  }

  res.status(201).json({
    status: 'success',
    data: {
      event
    }
  });
});

// @desc    Update club event
// @route   PUT /api/clubs/:clubId/events/:eventId
// @access  Private (Organizer or Admin/Moderator)
export const updateClubEvent = catchAsync(async (req, res, next) => {
  const event = await ClubEvent.findById(req.params.eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check permissions
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  const isOrganizer = event.organizer.toString() === req.user._id.toString();
  const isModerator = membership && ['admin', 'moderator'].includes(membership.role);

  if (!isOrganizer && !isModerator) {
    return next(new AppError('You do not have permission to update this event', 403));
  }

  // Update allowed fields
  const allowedFields = ['title', 'description', 'eventDate', 'duration', 'location', 'maxAttendees', 'agenda', 'resources'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      event[field] = req.body[field];
    }
  });

  await event.save();
  await event.populate('organizer', 'name avatar');

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

// @desc    Delete club event
// @route   DELETE /api/clubs/:clubId/events/:eventId
// @access  Private (Organizer or Admin/Moderator)
export const deleteClubEvent = catchAsync(async (req, res, next) => {
  const event = await ClubEvent.findById(req.params.eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check permissions
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  const isOrganizer = event.organizer.toString() === req.user._id.toString();
  const isModerator = membership && ['admin', 'moderator'].includes(membership.role);

  if (!isOrganizer && !isModerator) {
    return next(new AppError('You do not have permission to delete this event', 403));
  }

  await ClubEvent.findByIdAndDelete(req.params.eventId);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    RSVP to event
// @route   POST /api/clubs/:clubId/events/:eventId/rsvp
// @access  Private (Members only)
export const rsvpToEvent = catchAsync(async (req, res, next) => {
  const { status } = req.body; // 'attending', 'maybe', 'not_attending'

  // Check membership
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to RSVP to events', 403));
  }

  const event = await ClubEvent.findById(req.params.eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check if event is full
  if (status === 'attending' && event.maxAttendees) {
    const attendingCount = event.attendees.filter(a => a.status === 'attending').length;
    if (attendingCount >= event.maxAttendees) {
      return next(new AppError('Event is full', 400));
    }
  }

  // Remove existing RSVP
  event.attendees = event.attendees.filter(
    attendee => attendee.user.toString() !== req.user._id.toString()
  );

  // Add new RSVP
  event.attendees.push({
    user: req.user._id,
    status,
    rsvpDate: new Date()
  });

  await event.save();

  res.status(200).json({
    status: 'success',
    data: {
      message: `RSVP updated to ${status}`,
      attendees: event.attendees
    }
  });
});

// @desc    Get event attendees
// @route   GET /api/clubs/:clubId/events/:eventId/attendees
// @access  Private (Members only)
export const getEventAttendees = catchAsync(async (req, res, next) => {
  // Check membership
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to view attendees', 403));
  }

  const event = await ClubEvent.findById(req.params.eventId)
    .populate('attendees.user', 'name avatar location')
    .lean();

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      attendees: event.attendees
    }
  });
});