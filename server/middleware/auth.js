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

// Role-based middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }
    
    // Admin and superadmin can access everything
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }
    
    // Check if user has the required role
    if (req.user.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)} privileges required.` 
      });
    }
    
    next();
  };
};

// Organizer-specific middleware
export const requireOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no user found' });
  }
  
  // Admin and superadmin can access organizer routes
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }
  
  // Check if user has organizer flag or organizer role
  if (!req.user.isOrganizer && req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Access denied. Organizer privileges required.' });
  }
  
  // Check if organizer is verified
  if (!req.user.verified) {
    return res.status(403).json({ 
      message: 'Your organizer account is pending verification. Please wait for admin approval.' 
    });
  }
  
  next();
};

// Organizer or Admin middleware
export const requireOrganizerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no user found' });
  }
  
  if (req.user.isOrganizer || req.user.role === 'organizer' || req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Organizer or Admin privileges required.' });
};