import express from 'express';
import {
  getBookClubs,
  getBookClub,
  createBookClub,
  updateBookClub,
  deleteBookClub,
  joinBookClub,
  leaveBookClub,
  getClubMembers,
  updateMemberRole,
  removeMember,
  getMyClubs
} from '../controllers/bookClubController.js';
import {
  getClubPosts,
  getClubPost,
  createClubPost,
  updateClubPost,
  deleteClubPost,
  addReaction,
  addComment,
  voteOnPoll
} from '../controllers/clubPostController.js';
import {
  getClubEvents,
  getClubEvent,
  createClubEvent,
  updateClubEvent,
  deleteClubEvent,
  rsvpToEvent,
  getEventAttendees
} from '../controllers/clubEventController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Club routes
router.route('/')
  .get(optionalAuth, getBookClubs)
  .post(protect, createBookClub);

router.get('/my-clubs', protect, getMyClubs);

router.route('/:id')
  .get(optionalAuth, getBookClub)
  .put(protect, updateBookClub)
  .delete(protect, deleteBookClub);

// Membership routes
router.post('/:id/join', protect, joinBookClub);
router.post('/:id/leave', protect, leaveBookClub);

router.route('/:id/members')
  .get(optionalAuth, getClubMembers);

router.route('/:id/members/:userId')
  .put(protect, updateMemberRole)
  .delete(protect, removeMember);

// Post routes
router.route('/:clubId/posts')
  .get(optionalAuth, getClubPosts)
  .post(protect, createClubPost);

router.route('/:clubId/posts/:postId')
  .get(optionalAuth, getClubPost)
  .put(protect, updateClubPost)
  .delete(protect, deleteClubPost);

router.post('/:clubId/posts/:postId/reactions', protect, addReaction);
router.post('/:clubId/posts/:postId/comments', protect, addComment);
router.post('/:clubId/posts/:postId/poll/vote', protect, voteOnPoll);

// Event routes
router.route('/:clubId/events')
  .get(optionalAuth, getClubEvents)
  .post(protect, createClubEvent);

router.route('/:clubId/events/:eventId')
  .get(optionalAuth, getClubEvent)
  .put(protect, updateClubEvent)
  .delete(protect, deleteClubEvent);

router.post('/:clubId/events/:eventId/rsvp', protect, rsvpToEvent);
router.get('/:clubId/events/:eventId/attendees', protect, getEventAttendees);

export default router;