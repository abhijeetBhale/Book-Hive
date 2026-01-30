import User from '../models/User.js';
import Role from '../models/Role.js';

/**
 * Check if user has required permission
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @param {object} options - Additional options
 */
export const requirePermission = (requiredPermissions, options = {}) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Get user with populated roles
      const user = await User.findById(req.user._id)
        .populate('roles', 'name permissions')
        .select('+effectivePermissions +permissions +roles');

      if (!user) {
        return res.status(401).json({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Compute effective permissions if not already computed
      if (!user.effectivePermissions || user.effectivePermissions.length === 0) {
        await user.computeEffectivePermissions();
        await user.save();
      }

      // Check permissions
      const hasPermission = options.requireAll 
        ? permissions.every(permission => user.hasPermission(permission))
        : permissions.some(permission => user.hasPermission(permission));

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissions,
          userPermissions: user.effectivePermissions
        });
      }

      // Add user permissions to request for further use
      req.userPermissions = user.effectivePermissions;
      next();

    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        message: 'Permission check failed',
        code: 'RBAC_ERROR'
      });
    }
  };
};

/**
 * Check if user has required role
 * @param {string|string[]} requiredRoles - Role(s) required
 * @param {object} options - Additional options
 */
export const requireRole = (requiredRoles, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      const user = await User.findById(req.user._id)
        .populate('roles', 'name displayName');

      if (!user) {
        return res.status(401).json({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check legacy role first (backward compatibility)
      const hasLegacyRole = roles.includes(user.role);
      
      // Check RBAC roles
      const userRoleNames = user.roles.map(role => role.name);
      const hasRBACRole = roles.some(role => userRoleNames.includes(role));

      const hasRole = hasLegacyRole || hasRBACRole;

      if (!hasRole) {
        return res.status(403).json({
          message: 'Insufficient role privileges',
          code: 'INSUFFICIENT_ROLE',
          required: roles,
          userRole: user.role,
          userRoles: userRoleNames
        });
      }

      next();

    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        message: 'Role check failed',
        code: 'ROLE_ERROR'
      });
    }
  };
};

/**
 * Resource ownership check
 * @param {string} resourceModel - Model name to check
 * @param {string} resourceIdParam - Parameter name for resource ID
 * @param {string} ownerField - Field name that contains owner ID
 */
export const requireOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          message: 'Resource ID required',
          code: 'RESOURCE_ID_REQUIRED'
        });
      }

      // Dynamic model import
      const Model = (await import(`../models/${resourceModel}.js`)).default;
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Check ownership
      const ownerId = resource[ownerField];
      const isOwner = ownerId && ownerId.toString() === req.user._id.toString();

      if (!isOwner) {
        // Check if user has admin permissions to override ownership
        const user = await User.findById(req.user._id);
        const hasAdminPermission = user.hasPermission('manage_all_resources') || 
                                  user.role === 'admin' || 
                                  user.role === 'superadmin';

        if (!hasAdminPermission) {
          return res.status(403).json({
            message: 'Resource access denied',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }
      }

      // Add resource to request for further use
      req.resource = resource;
      req.isOwner = isOwner;
      next();

    } catch (error) {
      console.error('Ownership middleware error:', error);
      return res.status(500).json({
        message: 'Ownership check failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

/**
 * Combine multiple RBAC checks with OR logic
 * @param {...Function} middlewares - RBAC middleware functions
 */
export const anyOf = (...middlewares) => {
  return async (req, res, next) => {
    let lastError = null;
    
    for (const middleware of middlewares) {
      try {
        await new Promise((resolve, reject) => {
          middleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // If we get here, the middleware passed
        return next();
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    // All middlewares failed
    return res.status(403).json({
      message: 'Access denied - insufficient privileges',
      code: 'ACCESS_DENIED'
    });
  };
};

/**
 * Get user permissions for client-side use
 */
export const getUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user._id)
      .populate('roles', 'name permissions')
      .select('+effectivePermissions +permissions');

    if (user) {
      // Ensure effective permissions are computed
      if (!user.effectivePermissions || user.effectivePermissions.length === 0) {
        await user.computeEffectivePermissions();
        await user.save();
      }
      
      req.userPermissions = user.effectivePermissions;
    }

    next();
  } catch (error) {
    console.error('Get user permissions error:', error);
    next(); // Continue without permissions
  }
};

// Predefined permission sets for common use cases
export const PERMISSIONS = {
  // Basic permissions
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Book management
  MANAGE_BOOKS: 'manage_books',
  EDIT_ALL_BOOKS: 'edit_all_books',
  DELETE_ALL_BOOKS: 'delete_all_books',
  
  // Event management
  MANAGE_EVENTS: 'manage_events',
  CREATE_EVENTS: 'create_events',
  EDIT_ALL_EVENTS: 'edit_all_events',
  
  // System administration
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_ROLES: 'manage_roles',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_ALL_RESOURCES: 'manage_all_resources'
};

export default {
  requirePermission,
  requireRole,
  requireOwnership,
  anyOf,
  getUserPermissions,
  PERMISSIONS
};