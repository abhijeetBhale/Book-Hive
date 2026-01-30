import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  updateLocation,
  updateSecuritySettings,
  getAccountActivity,
  enable2FA,
  disable2FA,
  verify2FA,
  verifyEmail,
  resendVerification
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// --- Google OAuth Routes (only if credentials are configured) ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    (req, res, next) => {
      // Store redirect URL in state parameter to pass through OAuth flow
      const redirectUrl = req.query.redirect || process.env.CLIENT_URL;
      const state = Buffer.from(redirectUrl).toString('base64');
      
      passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: state
      })(req, res, next);
    }
  );

  router.get(
    '/google/callback',
    (req, res, next) => {
      console.log('🔍 Google OAuth callback received');
      console.log('   Query params:', req.query);
      console.log('   Headers:', req.headers);
      
      passport.authenticate('google', { session: false }, (err, user, info) => {
        console.log('🔍 Passport authenticate result:');
        console.log('   Error:', err);
        console.log('   User:', user ? 'User found' : 'No user');
        console.log('   Info:', info);
        
        if (err) {
          console.error('❌ Google OAuth Error:', err);
          return res.status(500).json({
            success: false,
            message: 'Google OAuth authentication failed',
            error: err.message,
            details: 'Check server logs for more information'
          });
        }
        
        if (!user) {
          console.error('❌ Google OAuth: No user returned');
          return res.status(401).json({
            success: false,
            message: 'Google OAuth authentication failed - no user data received',
            details: 'This usually means there\'s a configuration issue with Google Console'
          });
        }
        
        try {
          const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
          });
          console.log('✅ Google OAuth Success for user:', user.email);
          
          // Decode redirect URL from state parameter, fallback to CLIENT_URL
          let redirectUrl = process.env.CLIENT_URL;
          if (req.query.state) {
            try {
              redirectUrl = Buffer.from(req.query.state, 'base64').toString('utf-8');
            } catch (e) {
              console.log('⚠️ Failed to decode state, using CLIENT_URL');
            }
          }
          
          console.log('🔄 Redirecting to:', redirectUrl);
          res.redirect(`${redirectUrl}/auth/callback?token=${token}`);
        } catch (tokenError) {
          console.error('❌ JWT Token Error:', tokenError);
          res.status(500).json({
            success: false,
            message: 'Failed to create authentication token',
            error: tokenError.message
          });
        }
      })(req, res, next);
    }
  );
} else {
  // Provide fallback routes that return helpful error messages
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please contact the administrator.'
    });
  });

  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please contact the administrator.'
    });
  });
}

// --- Local Email/Password Routes ---

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', protect, getProfile);

// Enhanced multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  console.error('Multer Error:', err);

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file allowed.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Expected field name: avatar'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
    }
  }

  if (err && err.message && err.message.includes('File type not supported')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Pass other errors to the global error handler
  next(err);
};

// Profile update route with proper error handling
router.put('/profile', protect, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, updateProfile);

router.put('/change-password', protect, changePassword);
router.put('/location', protect, updateLocation);

// Security-related routes
router.put('/security-settings', protect, updateSecuritySettings);
router.get('/account-activity', protect, getAccountActivity);
router.post('/enable-2fa', protect, enable2FA);
router.post('/disable-2fa', protect, disable2FA);
router.post('/verify-2fa', protect, verify2FA);

// Token validation endpoint
router.get('/validate-token', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

export default router;