import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import hpp from 'hpp';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import messageRoutes from './routes/messages.js';
import errorHandler from './middleware/errorHandler.js';
import connectDatabase from './config/database.js';
import './config/cloudinary.js';
import './config/passport-setup.js'; 
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import borrowRoutes from './routes/borrow.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import { sendOverdueReminders } from './services/reminderService.js';
import reportRoutes from './routes/reportRoutes.js';
import testimonialRoutes from './routes/testimonials.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet());
app.use(hpp());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);


// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Schedule reminder service (daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  await sendOverdueReminders();
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --- Socket.IO setup ---
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174', // Add Vite dev server port
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Expose io to routes/controllers
app.set('io', io);

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

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`WebSocket user connected: ${userId} (socket: ${socket.id})`);
  
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  socket.join(`user:${userId}`);
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

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});