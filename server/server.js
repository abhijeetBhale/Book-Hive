import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cron from 'node-cron';
import hpp from 'hpp';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import messageRoutes from './routes/messages.js';
import errorHandler from './middleware/errorHandler.js';
import connectDatabase from './config/database.js';
import './config/cloudinary.js';
import './config/passport-setup.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import cachedBookRoutes from './routes/cachedBooks.js';
import bookSearchRoutes from './routes/bookSearch.js';
import borrowRoutes from './routes/borrow.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import { sendOverdueReminders } from './services/reminderService.js';
import reportRoutes from './routes/reportRoutes.js';
import testimonialRoutes from './routes/testimonials.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import bookClubRoutes from './routes/bookClubRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes from './routes/payment.js';
import eventRoutes from './routes/eventRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import walletRoutes from './routes/wallet.js';
import broadcastRoutes from './routes/broadcasts.js';
import verificationPromptRoutes from './routes/verificationPrompt.js';
import { initializeDefaultAchievements } from './services/achievementService.js';
import { initializeAllUserStats } from './services/userStatsService.js';
import NotificationService from './services/notificationService.js';
import AdminNotificationService from './services/adminNotificationService.js';
import User from './models/User.js';

// New imports for added features
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './config/swagger.js';
import { getUserPermissions } from './middleware/rbac.js';
import { initializeQueues, getAllQueueStats, getQueuesHealth } from './services/jobQueue.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database and initialize
const initializeApp = async () => {
  try {
    await connectDatabase();
    
    // Initialize Redis
    console.log('🔄 Initializing Redis...');
    try {
      const redisInit = await import('./config/redisInit.js');
      const redisInitialized = await redisInit.default.initialize();
      
      if (redisInitialized) {
        console.log('✅ Redis initialized successfully');
        app.set('redisEnabled', true);
        
        // Initialize job queues after Redis connection
        console.log('🔄 Initializing job queues...');
        const queuesInitialized = await initializeQueues();
        app.set('jobQueuesEnabled', queuesInitialized);
        
        if (queuesInitialized) {
          console.log('✅ Job queues initialized successfully');
        } else {
          console.log('⚠️  Job queues initialization failed, continuing without background jobs');
        }
      } else {
        console.log('⚠️  Redis initialization failed, continuing without cache and job queues');
        app.set('redisEnabled', false);
        app.set('jobQueuesEnabled', false);
      }
    } catch (redisError) {
      console.error('❌ Redis initialization error:', redisError.message);
      console.log('⚠️  Application will continue without Redis caching and job queues');
      app.set('redisEnabled', false);
      app.set('jobQueuesEnabled', false);
    }
    
    console.log('🔄 Initializing achievements and user stats...');
    await initializeDefaultAchievements();
    await initializeAllUserStats();
    console.log('✅ App initialization completed');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};

initializeApp();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "ws://localhost:5000"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(hpp());

// Compression middleware - compress all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Compression level (0-9, 6 is default)
}));

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'https://book-hive-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
    ],
    credentials: true,
    exposedHeaders: [
      'x-rtb-fingerprint-id',
      'Authorization',
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With'
    ]
  })
);

// Rate limiting - TEMPORARILY DISABLED for debugging 429 errors
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 2000, // Very high limit for production
//   message: {
//     error: 'Too many requests from this IP, please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     // Skip rate limiting for critical endpoints
//     return req.path === '/api/health' || 
//            req.path === '/api/cors-test' ||
//            req.path.startsWith('/api/auth/') ||
//            req.path.startsWith('/api/users/') ||
//            req.path.startsWith('/api/testimonials');
//   },
// });
// app.use('/api/', limiter);

console.log('⚠️ Rate limiting is DISABLED for debugging purposes');

// Add request logging middleware to debug 429 errors
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Add user permissions middleware for all routes
app.use(getUserPermissions);

// API Documentation (Swagger)
if (process.env.SWAGGER_ENABLED === 'true') {
  const docsPath = process.env.API_DOCS_PATH || '/api-docs';
  
  // Disable CSP for Swagger UI to allow it to make API calls
  app.use(docsPath, (req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Content-Security-Policy');
    res.removeHeader('X-WebKit-CSP');
    next();
  });
  
  app.use(docsPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  console.log(`📚 API Documentation available at: ${docsPath}`);
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 version:
 *                   type: string
 *                   example: "2.0.0"
 *                 features:
 *                   type: object
 *                   properties:
 *                     redis:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         connected:
 *                           type: boolean
 *                     jobQueues:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         healthy:
 *                           type: boolean
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     swagger:
 *                       type: boolean
 *                       example: true
 *                     rbac:
 *                       type: boolean
 *                       example: true
 *       500:
 *         description: Server health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Health check failed"
 *                 error:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check endpoint (before other routes)
app.get('/api/health', async (req, res) => {
  try {
    // Check Redis status if enabled
    let redisStatus = { enabled: false };
    if (app.get('redisEnabled')) {
      try {
        const redisInit = await import('./config/redisInit.js');
        redisStatus = await redisInit.default.getStatus();
        redisStatus.enabled = true;
      } catch (redisError) {
        redisStatus = { enabled: true, connected: false, error: redisError.message };
      }
    }

    // Check job queues status
    let jobQueuesStatus = { enabled: false };
    if (app.get('jobQueuesEnabled')) {
      try {
        jobQueuesStatus = await getQueuesHealth();
        jobQueuesStatus.enabled = true;
      } catch (jobError) {
        jobQueuesStatus = { enabled: false, error: jobError.message };
      }
    }

    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      features: {
        redis: redisStatus,
        jobQueues: jobQueuesStatus,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        swagger: process.env.SWAGGER_ENABLED === 'true',
        rbac: true,
        testing: process.env.NODE_ENV === 'test'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Test endpoint working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test endpoint working"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Test endpoint to debug routing issues
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/jobs/status:
 *   get:
 *     summary: Get job queue status
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job queue status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 queues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "email"
 *                       waiting:
 *                         type: number
 *                         example: 0
 *                       active:
 *                         type: number
 *                         example: 1
 *                       completed:
 *                         type: number
 *                         example: 25
 *                       failed:
 *                         type: number
 *                         example: 2
 *                       delayed:
 *                         type: number
 *                         example: 0
 *                 health:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to get job queue status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Job queues not enabled"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Job queue status endpoint
app.get('/api/jobs/status', async (req, res) => {
  try {
    if (!app.get('jobQueuesEnabled')) {
      return res.json({
        success: false,
        error: 'Job queues not enabled',
        timestamp: new Date().toISOString()
      });
    }
    
    const stats = await getAllQueueStats();
    const health = await getQueuesHealth();
    
    res.json({
      success: true,
      queues: stats,
      health: health.healthy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add specific headers for Razorpay integration
app.use('/api/payment', (req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'x-rtb-fingerprint-id, Authorization, Content-Type');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-rtb-fingerprint-id');
  next();
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/books-cached', cachedBookRoutes);
app.use('/api/book-search', bookSearchRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clubs', bookClubRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/users/verification-prompt', verificationPromptRoutes);

// Error handler middleware
app.use(errorHandler);

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Schedule consolidated reminder service - Run twice daily (9 AM, 6 PM)
// This sends consolidated daily digest emails to prevent spam
cron.schedule('0 9,18 * * *', async () => {
  const now = new Date().toLocaleTimeString();
  console.log(`📧 Running consolidated book return reminder service at ${now}...`);
  await sendOverdueReminders(io);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --- Socket.IO setup with performance optimizations ---
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'https://book-hive-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174', // Add Vite dev server port
    ],
    credentials: true,
    methods: ['GET', 'POST'],
    exposedHeaders: [
      'x-rtb-fingerprint-id',
      'Authorization',
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With'
    ]
  },
  transports: ['websocket', 'polling'],
  // Performance optimizations
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  upgradeTimeout: 10000, // 10 seconds
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true, // Allow Engine.IO v3 clients
  perMessageDeflate: {
    threshold: 1024 // Compress messages larger than 1KB
  },
  httpCompression: {
    threshold: 1024 // Compress HTTP responses larger than 1KB
  }
});

// Expose io to routes/controllers
app.set('io', io);

// Initialize notification service
const notificationService = new NotificationService(io);
app.set('notificationService', notificationService);

// Initialize admin notification service
const adminNotificationService = new AdminNotificationService(io);
app.set('adminNotificationService', adminNotificationService);

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    console.log('WebSocket auth attempt:', {
      hasToken: !!token,
      authHeader: socket.handshake.auth,
      headers: socket.handshake.headers?.authorization
    });

    if (!token) {
      console.log('WebSocket connection rejected: no token');
      return next(new Error('Not authorized, no token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    console.log('WebSocket connection authorized for user:', decoded.userId);
    return next();
  } catch (err) {
    console.error('WebSocket auth error:', err.message);
    return next(err);
  }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  console.log(`WebSocket user connected: ${userId} (socket: ${socket.id})`);

  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  socket.join(`user:${userId}`);
  
  // Check if user is admin and join admin room (only if DB is connected)
  try {
    // Wait a bit to ensure DB is connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select('role');
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        socket.join('admin-room');
        socket.userRole = user.role; // Store role for debugging
        console.log(`👑 Admin user ${userId} (${user.role}) joined admin-room`);
        
        // Send initial notification counts when admin connects
        try {
          const adminNotificationService = app.get('adminNotificationService');
          if (adminNotificationService) {
            // You can add logic here to send current pending counts
            socket.emit('admin-connected', { 
              message: 'Connected to admin notifications',
              timestamp: new Date().toISOString()
            });
          }
        } catch (notifError) {
          console.error('Error sending admin connection notification:', notifError);
        }
      } else {
        socket.userRole = user?.role || 'user';
        console.log(`👤 Regular user ${userId} (${socket.userRole}) connected`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking user role for admin room:', error);
  }
  
  io.emit('presence:update', Array.from(onlineUsers.keys()));

  socket.on('typing', ({ recipientId }) => {
    if (recipientId) {
      io.to(`user:${recipientId}`).emit('typing', { from: userId });
    }
  });

  socket.on('typing:stop', ({ recipientId }) => {
    if (recipientId) {
      io.to(`user:${recipientId}`).emit('typing:stop', { from: userId });
    }
  });

  // Handle admin room check
  socket.on('check-admin-room', () => {
    const rooms = Array.from(socket.rooms);
    const isInAdminRoom = rooms.includes('admin-room');
    console.log(`🔍 Admin room check for user ${userId}:`, {
      rooms,
      isInAdminRoom,
      userRole: socket.userRole
    });
    socket.emit('admin-room-status', { isInAdminRoom, rooms });
  });

  // The 'message:send' listener is now removed to prevent duplicate events.
  // The API controller handles emitting 'message:new'.

  socket.on('disconnect', () => {
    const set = onlineUsers.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        onlineUsers.delete(userId);
        // Update lastSeen timestamp to the user's lastActive time (not current time)
        // This ensures we show realistic "last seen" based on actual activity
        User.findById(userId).then(user => {
          if (user) {
            // Use the user's lastActive time as lastSeen, or current time if lastActive is newer
            const lastSeenTime = user.lastActive && user.lastActive > new Date(Date.now() - 5 * 60 * 1000) 
              ? user.lastActive 
              : new Date();
            
            User.findByIdAndUpdate(userId, { lastSeen: lastSeenTime }).catch(err => {
              console.error('Failed to update lastSeen:', err);
            });
          }
        }).catch(err => {
          console.error('Failed to find user for lastSeen update:', err);
        });
      }
    }
    io.emit('presence:update', Array.from(onlineUsers.keys()));
  });
});



// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  console.error('Promise:', promise);
  // Don't exit the process in development, just log the error
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  // Exit the process for uncaught exceptions
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  // Close Redis connection
  if (app.get('redisEnabled')) {
    try {
      const redisInit = await import('./config/redisInit.js');
      await redisInit.default.shutdown();
    } catch (error) {
      console.error('❌ Error shutting down Redis:', error.message);
    }
  }
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  // Close Redis connection
  if (app.get('redisEnabled')) {
    try {
      const redisInit = await import('./config/redisInit.js');
      await redisInit.default.shutdown();
    } catch (error) {
      console.error('❌ Error shutting down Redis:', error.message);
    }
  }
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});