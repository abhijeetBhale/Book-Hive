const cacheService = require('./cacheService');
const User = require('../models/User');

class SocketService {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map(); // Local fallback
  }

  // Initialize Socket.IO with Redis integration
  initialize() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
    
    console.log('🔌 Socket.IO service initialized with Redis integration');
  }

  // Enhanced authentication middleware
  async authenticateSocket(socket, next) {
    try {
      const jwt = require('jsonwebtoken');
      const token = socket.handshake.auth?.token || 
                   socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.log('WebSocket connection rejected: no token');
        return next(new Error('Not authorized, no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      
      // Check if user session exists in Redis
      const sessionData = await cacheService.getUserSession(decoded.userId);
      if (sessionData) {
        socket.data.sessionData = sessionData;
        console.log(`🔐 WebSocket connection authorized for user: ${decoded.userId} (Redis session found)`);
      } else {
        console.log(`🔐 WebSocket connection authorized for user: ${decoded.userId} (No Redis session)`);
      }

      return next();
    } catch (err) {
      console.error('WebSocket auth error:', err.message);
      return next(err);
    }
  }

  // Enhanced connection handler with Redis integration
  async handleConnection(socket) {
    const userId = socket.data.userId;
    console.log(`🔌 WebSocket user connected: ${userId} (socket: ${socket.id})`);

    try {
      // Add user to online users in Redis
      await cacheService.addOnlineUser(userId);
      
      // Local fallback
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId).add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Update user's last seen timestamp
      await this.updateLastSeen(userId);

      // Check if user is admin
      await this.handleAdminConnection(socket, userId);

      // Broadcast online users update
      await this.broadcastOnlineUsers();

      // Set up event handlers
      this.setupEventHandlers(socket, userId);

    } catch (error) {
      console.error(`Error handling connection for user ${userId}:`, error);
    }
  }

  // Update user's last seen timestamp
  async updateLastSeen(userId) {
    try {
      // Update in database
      await User.findByIdAndUpdate(userId, { 
        lastSeen: new Date(),
        isOnline: true 
      });

      // Cache the last seen time
      await cacheService.set(`user:lastseen:${userId}`, new Date().toISOString(), 86400);
      
    } catch (error) {
      console.error(`Error updating last seen for user ${userId}:`, error);
    }
  }

  // Handle admin connections
  async handleAdminConnection(socket, userId) {
    try {
      const user = await User.findById(userId).select('role');
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        socket.join('admin-room');
        socket.userRole = user.role;
        console.log(`👑 Admin user ${userId} (${user.role}) joined admin-room`);

        // Send admin-specific data
        socket.emit('admin-connected', {
          message: 'Connected to admin notifications',
          timestamp: new Date().toISOString()
        });
      } else {
        socket.userRole = user?.role || 'user';
        console.log(`👤 Regular user ${userId} connected`);
      }
    } catch (error) {
      console.error(`Error handling admin connection for user ${userId}:`, error);
    }
  }

  // Set up event handlers for socket
  setupEventHandlers(socket, userId) {
    // Typing indicators
    socket.on('typing', ({ recipientId }) => {
      if (recipientId) {
        this.io.to(`user:${recipientId}`).emit('typing', { from: userId });
      }
    });

    socket.on('typing:stop', ({ recipientId }) => {
      if (recipientId) {
        this.io.to(`user:${recipientId}`).emit('typing:stop', { from: userId });
      }
    });

    // Admin room check
    socket.on('check-admin-room', () => {
      const rooms = Array.from(socket.rooms);
      const isInAdminRoom = rooms.includes('admin-room');
      socket.emit('admin-room-status', { 
        isInAdminRoom, 
        rooms,
        userRole: socket.userRole 
      });
    });

    // Book-related events
    socket.on('book:view', async (bookId) => {
      await this.handleBookView(userId, bookId);
    });

    socket.on('book:interest', async ({ bookId, type }) => {
      await this.handleBookInterest(userId, bookId, type);
    });

    // Location updates
    socket.on('location:update', async (locationData) => {
      await this.handleLocationUpdate(userId, locationData);
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      await this.handleDisconnection(socket, userId);
    });
  }

  // Handle book view events
  async handleBookView(userId, bookId) {
    try {
      // Cache recent book views for recommendations
      const recentViewsKey = `user:recentviews:${userId}`;
      const recentViews = await cacheService.get(recentViewsKey) || [];
      
      // Add new view (keep last 20)
      const updatedViews = [
        { bookId, timestamp: new Date().toISOString() },
        ...recentViews.filter(view => view.bookId !== bookId)
      ].slice(0, 20);

      await cacheService.set(recentViewsKey, updatedViews, 86400 * 7); // 7 days

      console.log(`📖 User ${userId} viewed book ${bookId}`);
    } catch (error) {
      console.error(`Error handling book view:`, error);
    }
  }

  // Handle book interest events (wishlist, borrow request, etc.)
  async handleBookInterest(userId, bookId, type) {
    try {
      // Notify book owner if online
      const Book = require('../models/Book');
      const book = await Book.findById(bookId).populate('owner');
      
      if (book && book.owner) {
        const notification = {
          type: `book_${type}`,
          bookId,
          bookTitle: book.title,
          interestedUser: userId,
          timestamp: new Date().toISOString()
        };

        // Send real-time notification to book owner
        this.io.to(`user:${book.owner._id}`).emit('notification:new', notification);

        // Cache notification for offline users
        const notificationKey = `notifications:${book.owner._id}`;
        const notifications = await cacheService.get(notificationKey) || [];
        notifications.unshift(notification);
        await cacheService.set(notificationKey, notifications.slice(0, 50), 86400 * 7);

        console.log(`🔔 Book ${type} notification sent to user ${book.owner._id}`);
      }
    } catch (error) {
      console.error(`Error handling book interest:`, error);
    }
  }

  // Handle location updates
  async handleLocationUpdate(userId, locationData) {
    try {
      const { latitude, longitude } = locationData;
      
      // Update user location in cache for nearby searches
      await cacheService.set(
        `user:location:${userId}`, 
        { latitude, longitude, timestamp: new Date().toISOString() },
        3600 // 1 hour
      );

      console.log(`📍 Location updated for user ${userId}: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error(`Error handling location update:`, error);
    }
  }

  // Handle disconnection
  async handleDisconnection(socket, userId) {
    try {
      console.log(`🔌 WebSocket user disconnected: ${userId} (socket: ${socket.id})`);

      // Remove from local tracking
      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.onlineUsers.delete(userId);
          
          // Remove from Redis online users
          await cacheService.removeOnlineUser(userId);
          
          // Update last seen
          await this.updateLastSeen(userId);
          
          // Update database
          await User.findByIdAndUpdate(userId, { isOnline: false });
        }
      }

      // Broadcast updated online users
      await this.broadcastOnlineUsers();

    } catch (error) {
      console.error(`Error handling disconnection for user ${userId}:`, error);
    }
  }

  // Broadcast online users to all connected clients
  async broadcastOnlineUsers() {
    try {
      // Get online users from Redis (more accurate across server instances)
      const onlineUsersFromRedis = await cacheService.getOnlineUsers();
      
      // Fallback to local tracking
      const onlineUsersList = onlineUsersFromRedis.length > 0 
        ? onlineUsersFromRedis 
        : Array.from(this.onlineUsers.keys());

      this.io.emit('presence:update', onlineUsersList);
      
      console.log(`👥 Broadcasting ${onlineUsersList.length} online users`);
    } catch (error) {
      console.error('Error broadcasting online users:', error);
      // Fallback to local data
      this.io.emit('presence:update', Array.from(this.onlineUsers.keys()));
    }
  }

  // Send notification to specific user
  async sendNotificationToUser(userId, notification) {
    try {
      // Send real-time notification
      this.io.to(`user:${userId}`).emit('notification:new', notification);

      // Cache for offline users
      const notificationKey = `notifications:${userId}`;
      const notifications = await cacheService.get(notificationKey) || [];
      notifications.unshift({
        ...notification,
        timestamp: new Date().toISOString()
      });
      await cacheService.set(notificationKey, notifications.slice(0, 50), 86400 * 7);

      console.log(`🔔 Notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  // Send notification to all admins
  async sendAdminNotification(notification) {
    try {
      this.io.to('admin-room').emit('admin:notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`👑 Admin notification sent: ${notification.type}`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  // Get online users count
  async getOnlineUsersCount() {
    try {
      const onlineUsers = await cacheService.getOnlineUsers();
      return onlineUsers.length;
    } catch (error) {
      console.error('Error getting online users count:', error);
      return this.onlineUsers.size;
    }
  }

  // Check if user is online
  async isUserOnline(userId) {
    try {
      const onlineUsers = await cacheService.getOnlineUsers();
      return onlineUsers.includes(userId);
    } catch (error) {
      console.error(`Error checking if user ${userId} is online:`, error);
      return this.onlineUsers.has(userId);
    }
  }

  // Broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Broadcast to specific room
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }
}

module.exports = SocketService;