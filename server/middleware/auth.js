import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
      
      // Update lastActive field for admin dashboard tracking
      if (req.user) {
        await User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() });
      }
      
      return next();
    } catch (error) {
      console.error('JWT Error:', error.message);
      
      // Provide specific error messages for different JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please login again.',
          error: 'INVALID_TOKEN'
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired. Please login again.',
          error: 'TOKEN_EXPIRED'
        });
      } else {
        return res.status(401).json({ 
          message: 'Authentication failed. Please login again.',
          error: 'AUTH_FAILED'
        });
      }
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      // Silently fail for optional auth
      req.user = null;
    }
  }

  return next();
};

export const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};