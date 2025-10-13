import ClubPost from '../models/ClubPost.js';
import ClubMembership from '../models/ClubMembership.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Get club posts
// @route   GET /api/clubs/:clubId/posts
// @access  Public (for public clubs) / Private (for private clubs)
export const getClubPosts = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    postType,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Check if user has access to club posts
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user?._id,
    status: 'active'
  });

  // For private clubs, user must be a member
  const BookClub = (await import('../models/BookClub.js')).default;
  const club = await BookClub.findById(req.params.clubId);
  if (club?.privacy === 'private' && !membership) {
    return next(new AppError('You must be a member to view posts', 403));
  }

  // Build query
  let query = { club: req.params.clubId };
  if (postType) {
    query.postType = postType;
  }

  // Sort options
  const sortOptions = {};
  if (sortBy === 'pinned') {
    sortOptions.isPinned = -1;
    sortOptions.createdAt = -1;
  } else {
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  const posts = await ClubPost.find(query)
    .populate('author', 'name avatar')
    .populate('attachedBook', 'title author coverImage')
    .populate('comments.author', 'name avatar')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await ClubPost.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single post
// @route   GET /api/clubs/:clubId/posts/:postId
// @access  Public/Private
export const getClubPost = catchAsync(async (req, res, next) => {
  const post = await ClubPost.findById(req.params.postId)
    .populate('author', 'name avatar location')
    .populate('attachedBook', 'title author coverImage description')
    .populate('comments.author', 'name avatar')
    .populate('reactions.user', 'name avatar')
    .lean();

  if (!post) {
    return next(new AppError('Post not found', 404));
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
    return next(new AppError('You must be a member to view this post', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      post
    }
  });
});

// @desc    Create club post
// @route   POST /api/clubs/:clubId/posts
// @access  Private (Members only)
export const createClubPost = catchAsync(async (req, res, next) => {
  const { title, content, postType, images, attachedBook, poll, tags } = req.body;

  // Check if user is a member
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to create posts', 403));
  }

  // Check if club allows discussions
  const BookClub = (await import('../models/BookClub.js')).default;
  const club = await BookClub.findById(req.params.clubId);
  if (!club.settings.allowDiscussions && postType === 'discussion') {
    return next(new AppError('Discussions are not allowed in this club', 403));
  }

  // Only admins/moderators can create announcements
  if (postType === 'announcement' && !['admin', 'moderator'].includes(membership.role)) {
    return next(new AppError('Only admins and moderators can create announcements', 403));
  }

  const post = await ClubPost.create({
    club: req.params.clubId,
    author: req.user._id,
    title,
    content,
    postType,
    images,
    attachedBook,
    poll,
    tags
  });

  await post.populate('author', 'name avatar');
  if (attachedBook) {
    await post.populate('attachedBook', 'title author coverImage');
  }

  // Update member stats
  membership.stats.postsCreated += 1;
  await membership.save();

  res.status(201).json({
    status: 'success',
    data: {
      post
    }
  });
});

// @desc    Update club post
// @route   PUT /api/clubs/:clubId/posts/:postId
// @access  Private (Author or Admin/Moderator)
export const updateClubPost = catchAsync(async (req, res, next) => {
  const post = await ClubPost.findById(req.params.postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Check permissions
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  const isAuthor = post.author.toString() === req.user._id.toString();
  const isModerator = membership && ['admin', 'moderator'].includes(membership.role);

  if (!isAuthor && !isModerator) {
    return next(new AppError('You do not have permission to update this post', 403));
  }

  // Update allowed fields
  const allowedFields = ['title', 'content', 'images', 'tags'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });

  // Only moderators can pin/unpin posts
  if (req.body.isPinned !== undefined && isModerator) {
    post.isPinned = req.body.isPinned;
  }

  await post.save();
  await post.populate('author', 'name avatar');

  res.status(200).json({
    status: 'success',
    data: {
      post
    }
  });
});

// @desc    Delete club post
// @route   DELETE /api/clubs/:clubId/posts/:postId
// @access  Private (Author or Admin/Moderator)
export const deleteClubPost = catchAsync(async (req, res, next) => {
  const post = await ClubPost.findById(req.params.postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Check permissions
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  const isAuthor = post.author.toString() === req.user._id.toString();
  const isModerator = membership && ['admin', 'moderator'].includes(membership.role);

  if (!isAuthor && !isModerator) {
    return next(new AppError('You do not have permission to delete this post', 403));
  }

  await ClubPost.findByIdAndDelete(req.params.postId);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Add reaction to post
// @route   POST /api/clubs/:clubId/posts/:postId/reactions
// @access  Private (Members only)
export const addReaction = catchAsync(async (req, res, next) => {
  const { type } = req.body;

  // Check membership
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to react to posts', 403));
  }

  const post = await ClubPost.findById(req.params.postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Remove existing reaction from this user
  post.reactions = post.reactions.filter(
    reaction => reaction.user.toString() !== req.user._id.toString()
  );

  // Add new reaction
  post.reactions.push({
    user: req.user._id,
    type
  });

  await post.save();

  res.status(200).json({
    status: 'success',
    data: {
      reactions: post.reactions
    }
  });
});

// @desc    Add comment to post
// @route   POST /api/clubs/:clubId/posts/:postId/comments
// @access  Private (Members only)
export const addComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;

  // Check membership
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to comment on posts', 403));
  }

  const post = await ClubPost.findById(req.params.postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  if (post.isLocked) {
    return next(new AppError('This post is locked for comments', 403));
  }

  post.comments.push({
    author: req.user._id,
    content
  });

  await post.save();
  await post.populate('comments.author', 'name avatar');

  const newComment = post.comments[post.comments.length - 1];

  res.status(201).json({
    status: 'success',
    data: {
      comment: newComment
    }
  });
});

// @desc    Vote on poll
// @route   POST /api/clubs/:clubId/posts/:postId/poll/vote
// @access  Private (Members only)
export const voteOnPoll = catchAsync(async (req, res, next) => {
  const { optionIndex } = req.body;

  // Check membership
  const membership = await ClubMembership.findOne({
    club: req.params.clubId,
    user: req.user._id,
    status: 'active'
  });

  if (!membership) {
    return next(new AppError('You must be a member to vote on polls', 403));
  }

  const post = await ClubPost.findById(req.params.postId);
  if (!post || post.postType !== 'poll') {
    return next(new AppError('Poll not found', 404));
  }

  if (post.poll.endsAt && new Date() > post.poll.endsAt) {
    return next(new AppError('This poll has ended', 400));
  }

  if (!post.poll.options[optionIndex]) {
    return next(new AppError('Invalid poll option', 400));
  }

  // Remove existing votes from this user if not allowing multiple
  if (!post.poll.allowMultiple) {
    post.poll.options.forEach(option => {
      option.votes = option.votes.filter(
        vote => vote.user.toString() !== req.user._id.toString()
      );
    });
  }

  // Check if user already voted for this option
  const existingVote = post.poll.options[optionIndex].votes.find(
    vote => vote.user.toString() === req.user._id.toString()
  );

  if (existingVote) {
    return next(new AppError('You have already voted for this option', 400));
  }

  // Add vote
  post.poll.options[optionIndex].votes.push({
    user: req.user._id
  });

  await post.save();

  res.status(200).json({
    status: 'success',
    data: {
      poll: post.poll
    }
  });
});