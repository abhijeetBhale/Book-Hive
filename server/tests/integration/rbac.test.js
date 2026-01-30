import request from 'supertest';
import express from 'express';
import { createTestUser, createAdminUser, generateTestToken, getAuthHeader } from '../helpers/testHelpers.js';
import { requirePermission, requireRole, PERMISSIONS } from '../../middleware/rbac.js';
import { protect } from '../../middleware/auth.js';
import Role from '../../models/Role.js';
import User from '../../models/User.js';

// Create test app
const app = express();
app.use(express.json());

// Test routes
app.get('/test/permission', protect, requirePermission(PERMISSIONS.MANAGE_USERS), (req, res) => {
  res.json({ success: true, message: 'Permission granted' });
});

app.get('/test/role', protect, requireRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Role access granted' });
});

app.get('/test/multiple-permissions', protect, requirePermission([PERMISSIONS.READ, PERMISSIONS.WRITE]), (req, res) => {
  res.json({ success: true, message: 'Multiple permissions granted' });
});

describe('RBAC Middleware', () => {
  let adminRole, userRole, adminUser, regularUser;

  beforeEach(async () => {
    // Create test roles
    adminRole = new Role({
      name: 'admin',
      displayName: 'Administrator',
      permissions: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.MANAGE_USERS],
      isSystem: true
    });
    await adminRole.save();

    userRole = new Role({
      name: 'user',
      displayName: 'User',
      permissions: [PERMISSIONS.READ],
      isSystem: true
    });
    await userRole.save();

    // Create test users
    adminUser = await createAdminUser({
      email: 'admin@test.com',
      roles: [adminRole._id]
    });
    await adminUser.computeEffectivePermissions();
    await adminUser.save();

    regularUser = await createTestUser({
      email: 'user@test.com',
      roles: [userRole._id]
    });
    await regularUser.computeEffectivePermissions();
    await regularUser.save();
  });

  describe('Permission-based access', () => {
    it('should allow access with required permission', async () => {
      const token = generateTestToken(adminUser._id, adminUser.role);

      const response = await request(app)
        .get('/test/permission')
        .set(getAuthHeader(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Permission granted');
    });

    it('should deny access without required permission', async () => {
      const token = generateTestToken(regularUser._id, regularUser.role);

      const response = await request(app)
        .get('/test/permission')
        .set(getAuthHeader(token))
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should handle multiple permissions (OR logic)', async () => {
      const token = generateTestToken(regularUser._id, regularUser.role);

      const response = await request(app)
        .get('/test/multiple-permissions')
        .set(getAuthHeader(token))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Role-based access', () => {
    it('should allow access with required role', async () => {
      const token = generateTestToken(adminUser._id, adminUser.role);

      const response = await request(app)
        .get('/test/role')
        .set(getAuthHeader(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Role access granted');
    });

    it('should deny access without required role', async () => {
      const token = generateTestToken(regularUser._id, regularUser.role);

      const response = await request(app)
        .get('/test/role')
        .set(getAuthHeader(token))
        .expect(403);

      expect(response.body.message).toContain('Insufficient role privileges');
      expect(response.body.code).toBe('INSUFFICIENT_ROLE');
    });
  });

  describe('User model RBAC methods', () => {
    it('should check permissions correctly', async () => {
      const user = await User.findById(adminUser._id).populate('roles');
      
      expect(user.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(true);
      expect(user.hasPermission(PERMISSIONS.READ)).toBe(true);
      expect(user.hasPermission('non_existent_permission')).toBe(false);
    });

    it('should check roles correctly', async () => {
      const user = await User.findById(adminUser._id);
      
      expect(user.hasRole('admin')).toBe(true);
      expect(user.hasRole('user')).toBe(false);
    });

    it('should compute effective permissions', async () => {
      const user = await User.findById(regularUser._id);
      await user.computeEffectivePermissions();
      
      expect(user.effectivePermissions).toContain(PERMISSIONS.READ);
      expect(user.effectivePermissions).not.toContain(PERMISSIONS.MANAGE_USERS);
    });
  });

  describe('Role model methods', () => {
    it('should find role by name', async () => {
      const role = await Role.findByName('admin');
      
      expect(role).toBeTruthy();
      expect(role.name).toBe('admin');
      expect(role.displayName).toBe('Administrator');
    });

    it('should check if role has permission', () => {
      expect(adminRole.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(true);
      expect(adminRole.hasPermission('non_existent_permission')).toBe(false);
    });

    it('should add and remove permissions', () => {
      const role = new Role({
        name: 'test',
        displayName: 'Test Role',
        permissions: [PERMISSIONS.READ]
      });

      role.addPermission(PERMISSIONS.WRITE);
      expect(role.permissions).toContain(PERMISSIONS.WRITE);

      role.removePermission(PERMISSIONS.READ);
      expect(role.permissions).not.toContain(PERMISSIONS.READ);
    });
  });
});