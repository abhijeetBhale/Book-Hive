import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser, getProfile, updateProfile, updateLocation } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js'; // Make sure this import is present

const router = express.Router();

// --- Google OAuth Routes ---
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// --- Local Email/Password Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);

// THE DEFINITIVE FIX IS HERE:
// The `upload.single('avatar')` middleware is now added. This tells your server
// to process a single file named 'avatar' from the request before passing it
// to the `updateProfile` function. This solves the 500 Internal Server Error.
router.put('/profile', protect, upload.single('avatar'), updateProfile);

router.put('/location', protect, updateLocation);

export default router;