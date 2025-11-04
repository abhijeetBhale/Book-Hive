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
  verify2FA
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// --- Google OAuth Routes (only if credentials are configured) ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
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
          res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
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
router.post('/register', registerUser);
router.post('/login', loginUser);
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

export default router;