import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

// Import config
import './config/cloudinary.js';
import './config/passport-setup.js';
import errorHandler from './middleware/errorHandler.js';

// Import services
import { initializeDefaultAchievements } from './services/achievementService.js';
import { initializeAllUserStats } from './services/userStatsService.js';

// Import ALL routes
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import bookSearchRoutes from './routes/bookSearch.js';
import borrowRoutes from './routes/borrow.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import messageRoutes from './routes/messages.js';
import reportRoutes from './routes/reportRoutes.js';
import testimonialRoutes from './routes/testimonials.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import bookClubRoutes from './routes/bookClubRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/payment.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

app.use(hpp());

// CORS configuration - Simplified and reliable
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://book-hive-frontend.onrender.com',
  'https://bookhive-frontend.vercel.app',
  'https://bookhive-client.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

console.log('🔧 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// API Routes
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
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    message: 'The requested endpoint does not exist',
  });
});

// Database connection
let isConnected = false;
let isInitialized = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI environment variable is not set');
      return null;
    }

    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxIdleTimeMS: 30000,
      minPoolSize: 0,
    };

    let connection;
    try {
      connection = await mongoose.connect(process.env.MONGODB_URI, options);
      isConnected = true;
      console.log('✅ MongoDB Connected');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('⚠️ Could not connect to primary MongoDB URI. Attempting in-memory MongoDB server...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          connection = await mongoose.connect(mongoUri, options);
          isConnected = true;
          console.log(`✅ In-Memory MongoDB Connected at ${mongoUri}`);
        } catch (memErr) {
          console.warn('⚠️ Database connection failed. Server is running without active database connection.');
          console.warn('💡 Set a valid MONGODB_URI in server/.env to enable database operations.');
          isConnected = false;
          return null;
        }
      } else {
        throw err;
      }
    }
    
    // Initialize achievements and user stats (only once if connected)
    if (isConnected && mongoose.connection.readyState === 1 && !isInitialized) {
      try {
        await initializeDefaultAchievements();
        await initializeAllUserStats();
        isInitialized = true;
        console.log('✅ App initialization completed');
      } catch (initError) {
        console.error('❌ Initialization error:', initError.message);
      }
    }
    
    return connection;
  } catch (error) {
    console.error('⚠️ Database connection error:', error.message);
    isConnected = false;
    return null;
  }
};

console.log('Starting server...');
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDB();
});