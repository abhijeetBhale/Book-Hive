import BookClub from '../models/BookClub.js';
import ClubMembership from '../models/ClubMembership.js';
import ClubPost from '../models/ClubPost.js';
import ClubEvent from '../models/ClubEvent.js';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get all book clubs with filters
// @route   GET /api/clubs
// @access  Public
export const getBookClubs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    search,
    genre,
    privacy = 'public',
    location,
    radius = 50, // km
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  let query = { isActive: true };

  // Privacy filter
  if (privacy !== 'all') {
    query.privacy = privacy;
  }

  // Search filter
  if (search) {
    query.$text = { $search: search };
  }

  // Genre filter
  if (genre) {
    query.genres = { $in: [genre] };
  }

  // Location filter
  if (location) {
    const [lng, lat] = location.split(',').map(Number);
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    };
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const clubs = await BookClub.find(query)
    .populate('createdBy', 'name avatar')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await BookClub.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      clubs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single book club
// @route   GET /api/clubs/:id
// @access  Public
export const getBookClub = catchAsync(async (req, res, next) => {
  const club = await BookClub.findById(req.params.id)
    .populate('createdBy', 'name avatar location')
    .lean();

  if (!club) {
    return next(new AppError('Club not found', 404));
  }

  // Get recent members
  const recentMembers = await ClubMembership.find({
    club: req.params.id,
    status: 'active'
  })
    .populate('user', 'name avatar')
    .sort({ joinedAt: -1 })
    .limit(10)
    .lean();

  // Get recent posts
  const recentPosts = await ClubPost.find({
    club: req.params.id
  })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Get upcoming events
  const upcomingEvents = await ClubEvent.find({
    club: req.params.id,
    eventDate: { $gte: new Date() },
    status: 'scheduled'
  })
    .populate('organizer', 'name avatar')
    .sort({ eventDate: 1 })
    .limit(3)
    .lean();

  // Check if current user is a member
  let userMembership = null;
  if (req.user) {
    userMembership = await ClubMembership.findOne({
      club: req.params.id,
      user: req.user._id,
      status: 'active'
    }).lean();
  }

  res.status(200).json({
    status: 'success',
    data: {
      club,
      recentMembers,
      recentPosts,
      upcomingEvents,
      userMembership
    }
  });
});

// @desc    Create new book club
// @route   POST /api/clubs
// @access  Private
export const createBookClub = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    privacy,
    maxMembers,
    genres,
    location,
    rules,
    settings
  } = req.body;

  // Create club
  const club = await BookClub.create({
    name,
    description,
    privacy,
    maxMembers,
    genres,
    location,
    rules,
    settings,
    createdBy: req.user._id
  });

  // Add creator as admin member
  await ClubMembership.create({
    club: club._id,
    user: req.user._id,
    role: 'admin',
    status: 'active'
  });

  // Populate creator info
  await club.populate('createdBy', 'name avatar');

  res.status(201).json({
    status: 'success',
    data: {
      club
    }
  });
});

// @desc    Update book club
// @route   PUT /api/clubs/:id
// @access  Private (Admin/Moderator only)
export const updateBookClub = catchAsync(async (req, res, next) => {
  // Check if user is admin or moderator
  const membership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.user._id,
    status: 'active',
    role: { $in: ['admin', 'moderator'] }
  });

  if (!membership) {
    return next(new AppError('You do not have permission to update this club', 403));
  }

  const club = await BookClub.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'name avatar');

  if (!club) {
    return next(new AppError('Club not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      club
    }
  });
});

// @desc    Delete book club
// @route   DELETE /api/clubs/:id
// @access  Private (Admin only)
export const deleteBookClub = catchAsync(async (req, res, next) => {
  // Check if user is admin
  const membership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.user._id,
    status: 'active',
    role: 'admin'
  });

  if (!membership) {
    return next(new AppError('You do not have permission to delete this club', 403));
  }

  const club = await BookClub.findById(req.params.id);
  if (!club) {
    return next(new AppError('Club not found', 404));
  }

  // Soft delete - mark as inactive
  club.isActive = false;
  await club.save();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Join book club
// @route   POST /api/clubs/:id/join
// @access  Private
export const joinBookClub = catchAsync(async (req, res, next) => {
  const club = await BookClub.findById(req.params.id);
  if (!club || !club.isActive) {
    return next(new AppError('Club not found', 404));
  }

  // Check if club is full
  if (club.currentMemberCount >= club.maxMembers) {
    return next(new AppError('Club is full', 400));
  }

  // Check if user is already a member
  const existingMembership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.user._id
  });

  if (existingMembership) {
    if (existingMembership.status === 'active') {
      return next(new AppError('You are already a member of this club', 400));
    } else if (existingMembership.status === 'pending') {
      return next(new AppError('Your membership request is pending approval', 400));
    } else if (existingMembership.status === 'banned') {
      return next(new AppError('You are banned from this club', 403));
    }
  }

  // Determine membership status based on club privacy
  let status = 'active';
  if (club.privacy === 'private' || club.settings.requireApproval) {
    status = 'pending';
  }

  // Create or update membership
  let membership;
  if (existingMembership) {
    existingMembership.status = status;
    existingMembership.joinedAt = new Date();
    membership = await existingMembership.save();
  } else {
    membership = await ClubMembership.create({
      club: req.params.id,
      user: req.user._id,
      status
    });
  }

  await membership.populate('user', 'name avatar');

  res.status(200).json({
    status: 'success',
    data: {
      membership,
      message: status === 'pending' ? 'Membership request sent for approval' : 'Successfully joined the club'
    }
  });
});

// @desc    Leave book club
// @route   POST /api/clubs/:id/leave
// @access  Private
export const leaveBookClub = catchAsync(async (req, res, next) => {
  const membership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You are not a member of this club', 400));
  }

  // Check if user is the only admin
  if (membership.role === 'admin') {
    const adminCount = await ClubMembership.countDocuments({
      club: req.params.id,
      role: 'admin',
      status: 'active'
    });

    if (adminCount === 1) {
      return next(new AppError('You cannot leave as you are the only admin. Please assign another admin first.', 400));
    }
  }

  membership.status = 'left';
  membership.leftAt = new Date();
  await membership.save();

  res.status(200).json({
    status: 'success',
    message: 'Successfully left the club'
  });
});

// @desc    Get club members
// @route   GET /api/clubs/:id/members
// @access  Public
export const getClubMembers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, role } = req.query;

  let query = {
    club: req.params.id,
    status: 'active'
  };

  if (role) {
    query.role = role;
  }

  const members = await ClubMembership.find(query)
    .populate('user', 'name avatar location rating')
    .sort({ role: 1, joinedAt: 1 }) // Admins first, then by join date
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await ClubMembership.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update member role
// @route   PUT /api/clubs/:id/members/:userId
// @access  Private (Admin only)
export const updateMemberRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;

  // Check if current user is admin
  const adminMembership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.user._id,
    status: 'active',
    role: 'admin'
  });

  if (!adminMembership) {
    return next(new AppError('You do not have permission to update member roles', 403));
  }

  const membership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.params.userId,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('Member not found', 404));
  }

  membership.role = role;
  await membership.save();
  await membership.populate('user', 'name avatar');

  res.status(200).json({
    status: 'success',
    data: {
      membership
    }
  });
});

// @desc    Remove member from club
// @route   DELETE /api/clubs/:id/members/:userId
// @access  Private (Admin/Moderator only)
export const removeMember = catchAsync(async (req, res, next) => {
  // Check if current user has permission
  const adminMembership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.user._id,
    status: 'active',
    role: { $in: ['admin', 'moderator'] }
  });

  if (!adminMembership) {
    return next(new AppError('You do not have permission to remove members', 403));
  }

  const membership = await ClubMembership.findOne({
    club: req.params.id,
    user: req.params.userId,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('Member not found', 404));
  }

  // Cannot remove admin if you're not admin
  if (membership.role === 'admin' && adminMembership.role !== 'admin') {
    return next(new AppError('You cannot remove an admin', 403));
  }

  membership.status = 'banned';
  membership.leftAt = new Date();
  await membership.save();

  res.status(200).json({
    status: 'success',
    message: 'Member removed successfully'
  });
});

// @desc    Get user's clubs
// @route   GET /api/clubs/my-clubs
// @access  Private
export const getMyClubs = catchAsync(async (req, res, next) => {
  const memberships = await ClubMembership.find({
    user: req.user._id,
    status: 'active'
  })
    .populate({
      path: 'club',
      select: 'name description coverImage privacy currentMemberCount maxMembers stats',
      populate: {
        path: 'createdBy',
        select: 'name avatar'
      }
    })
    .sort({ joinedAt: -1 })
    .lean();

  res.status(200).json({
    status: 'success',
    data: {
      clubs: memberships.map(m => ({
        ...m.club,
        membershipRole: m.role,
        joinedAt: m.joinedAt
      }))
    }
  });
});