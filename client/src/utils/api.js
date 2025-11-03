// import axios from "axios";

// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request interceptor to add the auth token to every secure request
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor for handling universal errors, like an expired session
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // If the token is invalid or expired, log the user out automatically
//       localStorage.removeItem("token");
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

// // --- API method definitions ---
// // These are all correctly defined. No changes are needed here.

// export const authAPI = {
//   login: (credentials) => api.post("/auth/login", credentials),
//   register: (userData) => api.post("/auth/register", userData),
//   getProfile: () => api.get("/auth/profile"),
//   // This correctly sends multipart/form-data when you include a file
//   updateProfile: (data) =>
//     api.put("/auth/profile", data, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),
//   updateLocation: (location) => api.put("/auth/location", location),
// };

// export const booksAPI = {
//   getAll: (params) => api.get("/books", { params }),
//   getById: (id) => api.get(`/books/${id}`),
//   getAllBooks: () => api.get("/books"),
//   // This is correctly configured for file uploads.
//   // It will correctly receive the new book data if the backend sends it.
//   create: (formData) =>
//     api.post("/books", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),
//   update: (id, formData) =>
//     api.put(`/books/${id}`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),
//   delete: (id) => api.delete(`/books/${id}`),
//   getMyBooks: () => api.get("/books/my-books"),
//   getUserBooks: (userId) => api.get(`/books/user/${userId}`),
// };

// export const borrowAPI = {
//   createRequest: (bookId) => api.post(`/borrow/request/${bookId}`), // Renamed for clarity
//   getMyRequests: () => api.get("/borrow/my-requests"),
//   getReceivedRequests: () => api.get("/borrow/received-requests"),
//   updateRequest: (requestId, status) =>
//     api.put(`/borrow/${requestId}`, { status }),
//   deleteRequest: (requestId) => api.delete(`/borrow/${requestId}`),
//   returnBook: (requestId) => api.put(`/borrow/${requestId}/return`),
// };

// export const usersAPI = {
//   getUsersWithBooks: (params) => api.get("/users/with-books", { params }),
//   getUserLocation: (userId) => api.get(`/users/${userId}/location`),
//   getUserProfile: (userId) => api.get(`/users/${userId}/profile`),
//   searchUsers: (params) => api.get("/users/search", { params }),
//   updatePublicKey: (publicKeyJwk) =>
//     api.put("/users/public-key", { publicKeyJwk }),
// };

// // Friends
// export const friendsAPI = {
//   getAll: () => api.get("/friends"),
//   respond: (id, response) => api.post(`/friends/respond/${id}`, { response }),
//   remove: (id) => api.delete(`/friends/${id}`),
//   // Change this line
//   cancelRequest: (id) => api.delete(`/friends/${id}`), // <-- FIX: Remove '/request' from the URL
// };

// // --- THE NEWLY ADDED API METHODS ---
// export const messagesAPI = {
//   sendMessage: (recipientId, data) => api.post(`/messages/send/${recipientId}`, data),
//   getConversations: () => api.get('/messages/conversations'),
//   getConversationWith: (userId) => api.get(`/messages/with/${userId}`),
//   clearConversation: (conversationId) => api.delete(`/messages/conversation/${conversationId}`),
// };

// // --- REPORT API METHODS ---
// export const reportAPI = {
//   createReport: (reportData) => api.post("/reports", reportData),
//   getMyReports: () => api.get("/reports/my-reports"),
// };

// // --- TESTIMONIAL API METHODS ---
// export const testimonialAPI = {
//   createTestimonial: (testimonialData) =>
//     api.post("/testimonials", testimonialData),
//   getPublishedTestimonials: () => api.get("/testimonials"),
//   getUserTestimonial: () => api.get("/testimonials/my-testimonial"),
//   updateUserTestimonial: (testimonialData) =>
//     api.put("/testimonials/my-testimonial", testimonialData),
//   deleteUserTestimonial: () => api.delete("/testimonials/my-testimonial"),
// };

// export const reviewsAPI = {
//   create: (payload) => api.post("/reviews", payload), // { borrowRequestId, toUserId, rating, comment }
//   listForUser: (userId, params) =>
//     api.get(`/reviews/user/${userId}`, { params }),
//   summaryForUser: (userId) => api.get(`/reviews/user/${userId}/summary`),
// };

// export const notificationsAPI = {
//   getUnreadCount: () => api.get('/users/notifications/unread-count').then(res => res.data),
//   markRead: () => api.put('/users/notifications/mark-read').then(res => res.data),
//   createBookInquiry: ({ toUserId, subject, body }) => api.post('/notifications/book-inquiry', { toUserId, subject, body }),
//   listBookInquiries: (params) => api.get('/notifications/book-inquiry', { params }),
//   delete: (id) => api.delete(`/notifications/${id}`),
// };
//     api.put("/users/notifications/mark-read").then((res) => res.data)

// export default api;

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the auth token to every secure request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling universal errors, like an expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If the token is invalid or expired, log the user out automatically
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// --- API method definitions ---

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) =>
    api.put("/auth/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (passwordData) => api.put("/auth/change-password", passwordData),
  updateLocation: (location) => api.put("/auth/location", location),
  updateSecuritySettings: (settings) => api.put("/auth/security-settings", settings),
  getAccountActivity: () => api.get("/auth/account-activity"),
  enable2FA: () => api.post("/auth/enable-2fa"),
  disable2FA: (code) => api.post("/auth/disable-2fa", { code }),
  verify2FA: (code) => api.post("/auth/verify-2fa", { code }),
};

export const booksAPI = {
  getAll: (params) => api.get("/books", { params }),
  getById: (id) => api.get(`/books/${id}`),
  getAllBooks: () => api.get("/books"),
  create: (formData) =>
    api.post("/books", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    api.put(`/books/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/books/${id}`),
  getMyBooks: () => api.get("/books/my-books"),
  getUserBooks: (userId) => api.get(`/books/user/${userId}`),
  // New advanced search endpoints
  searchByISBN: (isbn) => api.get(`/books/search/isbn/${isbn}`).then(res => res.data),
  getSuggestions: (params) => api.get("/books/suggestions", { params }).then(res => res.data),
  getTrending: (params) => api.get("/books/trending", { params }).then(res => res.data),
  getFilterOptions: () => api.get("/books/filters"),
};

export const bookSearchAPI = {
  searchBooks: (query, limit = 10) => api.get(`/book-search/search?q=${encodeURIComponent(query)}&limit=${limit}`).then(res => res.data),
  searchByISBN: (isbn) => api.get(`/book-search/search/isbn/${isbn}`).then(res => res.data),
  getBookCovers: (bookData) => api.post('/book-search/covers', bookData).then(res => res.data),
  validateImage: (url) => api.post('/book-search/validate-image', { url }).then(res => res.data),
  getExternalBookDetails: (source, id) => api.get(`/book-search/external/${source}/${id}`).then(res => res.data),
};

export const borrowAPI = {
  createRequest: (bookId) => api.post(`/borrow/request/${bookId}`),
  getMyRequests: () => api.get("/borrow/my-requests"),
  getReceivedRequests: () => api.get("/borrow/received-requests"),
  getAllBorrowRequests: () => api.get("/borrow/all-requests"),
  updateRequest: (requestId, status) =>
    api.put(`/borrow/${requestId}`, { status }),
  deleteRequest: (requestId) => api.delete(`/borrow/${requestId}`),
  returnBook: (requestId) => api.put(`/borrow/${requestId}/return`),
  markAsBorrowed: (requestId) => api.put(`/borrow/${requestId}/borrowed`),
  markAsReturned: (requestId) => api.put(`/borrow/${requestId}/returned`),
};

export const usersAPI = {
  getUsersWithBooks: (params) => api.get("/users/with-books", { params }),
  getUserLocation: (userId) => api.get(`/users/${userId}/location`),
  getUserProfile: (userId) => api.get(`/users/${userId}/profile`),
  searchUsers: (params) => api.get("/users/search", { params }),
  updatePublicKey: (publicKeyJwk) =>
    api.put("/users/public-key", { publicKeyJwk }),
};

export const friendsAPI = {
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  getAll: () => api.get("/friends"),
  respond: (id, action) => api.put(`/friends/request/${id}`, { action }),
  remove: (id) => api.delete(`/friends/${id}`),
  cancelRequest: (id) => api.delete(`/friends/${id}`),
};

export const messagesAPI = {
  sendMessage: (recipientId, data) => api.post(`/messages/send/${recipientId}`, data),
  sendFile: (recipientId, formData) => api.post(`/messages/send-file/${recipientId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getConversations: () => api.get('/messages/conversations'),
  getConversationWith: (userId) => api.get(`/messages/with/${userId}`),
  clearConversation: (conversationId) => api.delete(`/messages/conversation/${conversationId}`),
};

export const reportAPI = {
  createReport: (reportData) => api.post("/reports", reportData),
  getMyReports: () => api.get("/reports/my-reports"),
};



export const testimonialAPI = {
  createTestimonial: (testimonialData) =>
    api.post("/testimonials", testimonialData).then(res => res.data),
  getPublishedTestimonials: () => api.get("/testimonials").then(res => res.data),
  getUserTestimonial: () => api.get("/testimonials/my-testimonial").then(res => res.data),
  updateUserTestimonial: (testimonialData) =>
    api.put("/testimonials/my-testimonial", testimonialData).then(res => res.data),
  deleteUserTestimonial: () => api.delete("/testimonials/my-testimonial").then(res => res.data),
};

export const reviewsAPI = {
  create: (payload) => api.post("/reviews", payload),
  listForUser: (userId, params) =>
    api.get(`/reviews/user/${userId}`, { params }),
  summaryForUser: (userId) => api.get(`/reviews/user/${userId}/summary`),
};

export const notificationsAPI = {
  getUnreadCount: () => api.get('/notifications/count').then(res => res.data?.data || res.data),
  getAll: (params) => api.get('/notifications', { params }).then(res => res.data?.data || res.data),
  markRead: () => api.put('/notifications/mark-read').then(res => res.data),
  markAsRead: (notificationIds) => api.put('/notifications/mark-read', { notificationIds }).then(res => res.data),
  markAllAsRead: () => api.put('/notifications/mark-all-read').then(res => res.data),
  getModerationNotifications: () => api.get('/notifications/moderation').then(res => res.data?.data || res.data),
  createBookInquiry: ({ toUserId, subject, body }) => api.post('/notifications/book-inquiry', { toUserId, subject, body }).then(res => res.data),
  listBookInquiries: (params) => api.get('/notifications/book-inquiry', { params }).then(res => res.data?.data || res.data),

  delete: (id) => api.delete(`/notifications/${id}`).then(res => res.data),
  // New notification endpoints
  getNotificationsByType: (type, params) => api.get(`/notifications/type/${type}`, { params }).then(res => res.data?.data || res.data),
  getNotificationStats: () => api.get('/notifications/stats').then(res => res.data?.data || res.data),
  clearReadNotifications: () => api.delete('/notifications/clear-read').then(res => res.data),
  updatePreferences: (preferences) => api.put('/notifications/preferences', { preferences }).then(res => res.data),
};



// The problematic line has been removed from here.

export default api;