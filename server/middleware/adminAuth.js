import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Super Admin middleware - only for the platform owner
export const superAdminAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    return next(new AppError('Invalid token. User not found.', 401));
  }

  // Check if user is the super admin (you can set this via environment variable)
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'your-email@example.com';
  const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;
  
  // Debug logging
  console.log('Super Admin auth check:', { 
    userEmail: user.email, 
    userRole: user.role,
    superAdminEmail: SUPER_ADMIN_EMAIL,
    userId: user._id.toString()
  });
  
  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL || 
                      user.email === 'abhijeetbhale7@gmail.com' || // Hardcoded fallback
                      (SUPER_ADMIN_ID && user._id.toString() === SUPER_ADMIN_ID) ||
                      user.role === 'superadmin' ||
                      user.role === 'admin';

  if (!isSuperAdmin) {
    // Log unauthorized access attempt
    console.warn(`Unauthorized admin access attempt by user: ${user.email} (${user._id}) from IP: ${req.ip}`);
    return next(new AppError('Access denied. Insufficient privileges.', 403));
  }

  // Log admin access
  console.log(`Admin access granted to: ${user.email} (${user._id}) from IP: ${req.ip}`);
  
  req.user = user;
  next();
});

// Regular admin middleware (for future use if you want to add other admins)
export const adminAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    return next(new AppError('Invalid token. User not found.', 401));
  }

  // Check if user has admin privileges
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
  const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;
  
  // Debug logging
  console.log('Admin auth check:', { 
    userEmail: user.email, 
    userRole: user.role,
    superAdminEmail: SUPER_ADMIN_EMAIL,
    userId: user._id.toString()
  });
  
  const hasAdminAccess = ['admin', 'superadmin'].includes(user.role) ||
                        user.email === SUPER_ADMIN_EMAIL ||
                        user.email === 'abhijeetbhale7@gmail.com' || // Hardcoded fallback
                        (SUPER_ADMIN_ID && user._id.toString() === SUPER_ADMIN_ID);
  
  if (!hasAdminAccess) {
    console.warn(`Unauthorized admin access attempt by user: ${user.email} (${user._id}) from IP: ${req.ip}`);
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  console.log(`Admin access granted to: ${user.email} (${user._id}) from IP: ${req.ip}`);
  req.user = user;
  next();
});

// Audit logging middleware for admin actions
export const auditLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the admin action
      const auditLog = {
        adminId: req.user?._id,
        adminEmail: req.user?.email,
        action: action,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        success: res.statusCode < 400
      };
      
      console.log('Admin Action:', JSON.stringify(auditLog, null, 2));
      
      originalSend.call(this, data);
    };
    
    next();
  };
};