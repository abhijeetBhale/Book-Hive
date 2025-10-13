import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Achievements API
export const achievementsAPI = {
  // Get all achievements
  getAchievements: (params = {}) => api.get('/achievements', { params }),
  
  // Get user's achievements
  getMyAchievements: (params = {}) => api.get('/achievements/my-achievements', { params }),
  
  // Get leaderboard
  getLeaderboard: (params = {}) => api.get('/achievements/leaderboard', { params }),
  
  // Get user stats
  getUserStats: (userId = null) => {
    const endpoint = userId ? `/achievements/stats/${userId}` : '/achievements/stats';
    return api.get(endpoint);
  }
};

// Book Clubs API
export const clubsAPI = {
  // Get all clubs
  getClubs: (params = {}) => api.get('/clubs', { params }),
  
  // Get single club
  getClub: (id) => api.get(`/clubs/${id}`),
  
  // Create club
  createClub: (data) => api.post('/clubs', data),
  
  // Join club
  joinClub: (id) => api.post(`/clubs/${id}/join`),
  
  // Leave club
  leaveClub: (id) => api.post(`/clubs/${id}/leave`),
  
  // Get user's clubs
  getMyClubs: () => api.get('/clubs/my-clubs'),
  
  // Get club members
  getClubMembers: (id, params = {}) => api.get(`/clubs/${id}/members`, { params }),
  
  // Get club posts
  getClubPosts: (id, params = {}) => api.get(`/clubs/${id}/posts`, { params }),
  
  // Create club post
  createClubPost: (id, data) => api.post(`/clubs/${id}/posts`, data),
  
  // Get club events
  getClubEvents: (id, params = {}) => api.get(`/clubs/${id}/events`, { params }),
  
  // Create club event
  createClubEvent: (id, data) => api.post(`/clubs/${id}/events`, data),
  
  // RSVP to event
  rsvpToEvent: (clubId, eventId, data) => api.post(`/clubs/${clubId}/events/${eventId}/rsvp`, data)
};

// Challenges API
export const challengesAPI = {
  // Get all challenges
  getChallenges: (params = {}) => api.get('/challenges', { params }),
  
  // Get single challenge
  getChallenge: (id) => api.get(`/challenges/${id}`),
  
  // Join challenge
  joinChallenge: (id) => api.post(`/challenges/${id}/join`),
  
  // Leave challenge
  leaveChallenge: (id) => api.post(`/challenges/${id}/leave`),
  
  // Get user's challenges
  getMyChallenges: (params = {}) => api.get('/challenges/my-challenges', { params }),
  
  // Get challenge leaderboard
  getChallengeLeaderboard: (id) => api.get(`/challenges/${id}/leaderboard`)
};

export default {
  achievementsAPI,
  clubsAPI,
  challengesAPI
};