import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import passport from 'passport';
import mongoose from 'mongoose';

// Import middleware and config
import errorHandler from './middleware/errorHandler.js';
import './config/cloudinary.js';
import './config/passport-setup.js';

// Import services for initialization
import { initializeDefaultAchievements } from './services/achievementService.js';
import { initializeAllUserStats } from './services/userStatsService.js';

// Import ALL routes (restored to original)
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

const app = express();

// Database connection with serverless optimization
let isConnected = false;
let isInitialized = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
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

    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    console.log('✅ MongoDB Connected for serverless');
    
    // Initialize achievements and user stats (only once)
    if (!isInitialized) {
      try {
        await initializeDefaultAchievements();
        await initializeAllUserStats();
        isInitialized = true;
        console.log('✅ App initialization completed');
      } catch (initError) {
        console.error('❌ Initialization error:', initError.message);
        // Don't fail the connection if initialization fails
      }
    }
    
    return connection;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    isConnected = false;
    throw error;
  }
};

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

// CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'https://book-hive-frontend.onrender.com',
    'https://bookhive-frontend.vercel.app',
    'https://bookhive-client.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased for production
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BookHive API is running!',
    version: '2.0.0',
    status: 'active',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      books: '/api/books',
      users: '/api/users',
    },
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
    cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
    clientUrl: process.env.CLIENT_URL,
  });
});

// Google OAuth test endpoint
app.get('/api/auth/test-google', (req, res) => {
  res.status(200).json({
    message: 'Google OAuth test endpoint',
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    callbackUrl: '/api/auth/google/callback',
    clientUrl: process.env.CLIENT_URL,
  });
});

// API Routes (restored to original)
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

// Serverless function handler
export default async function handler(req, res) {
  try {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Connect to database
    await connectDB();

    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    console.error('Error stack:', error.stack);

    // Return proper error response
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
      });
    }
  }
}