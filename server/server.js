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
import broadcastRoutes from './routes/broadcasts.js';
import { initializeDefaultAchievements } from './services/achievementService.js';
import { initializeAllUserStats } from './services/userStatsService.js';
import NotificationService from './services/notificationService.js';
import AdminNotificationService from './services/adminNotificationService.js';
import User from './models/User.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database and initialize
const initializeApp = async () => {
  try {
    await connectDatabase();
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
app.use(helmet());
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
    credentials: true
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

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint to debug routing issues
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
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
app.use('/api/broadcasts', broadcastRoutes);

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
    methods: ['GET', 'POST']
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
        console.log(`Admin user ${userId} joined admin-room`);
      }
    }
  } catch (error) {
    console.error('Error checking user role for admin room:', error);
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

  // The 'message:send' listener is now removed to prevent duplicate events.
  // The API controller handles emitting 'message:new'.

  socket.on('disconnect', () => {
    const set = onlineUsers.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) onlineUsers.delete(userId);
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