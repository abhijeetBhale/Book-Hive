import User from '../../models/User.js';
import Role from '../../models/Role.js';
import { createTestUser } from '../helpers/testHelpers.js';

describe('Model Tests', () => {
  describe('User Model', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123'
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('user'); // Default role
      expect(user.createdAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const user = new User({});

      await expect(user.save()).rejects.toThrow();
    });

    it('should hash password before saving', async () => {
      const user = await createTestUser({
        password: 'plainpassword'
      });

      expect(user.password).not.toBe('plainpassword');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should compare passwords correctly', async () => {
      const user = await createTestUser({
        password: 'testpassword123'
      });

      const isMatch = await user.comparePassword('testpassword123');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should return public profile without sensitive data', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const publicProfile = user.getPublicProfile();

      expect(publicProfile.password).toBeUndefined();
      expect(publicProfile.name).toBe('Test User');
      expect(publicProfile.email).toBe('test@example.com');
    });

    it('should have default location coordinates', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(user.location.type).toBe('Point');
      expect(user.location.coordinates).toEqual([0, 0]);
      expect(user.location.address).toBe('Location not set');
    });

    it('should have default rating values', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(user.rating.overallRating).toBe(0);
      expect(user.rating.totalRatings).toBe(0);
      expect(user.rating.reviewCount).toBe(0);
      expect(user.rating.starLevel).toBe(0);
      expect(user.rating.trustLevel).toBe('new');
    });
  });

  describe('Role Model', () => {
    it('should create a role with required fields', async () => {
      const roleData = {
        name: 'test-role',
        displayName: 'Test Role',
        description: 'A test role',
        permissions: ['read', 'write']
      };

      const role = new Role(roleData);
      await role.save();

      expect(role._id).toBeDefined();
      expect(role.name).toBe(roleData.name);
      expect(role.displayName).toBe(roleData.displayName);
      expect(role.permissions).toEqual(roleData.permissions);
      expect(role.isActive).toBe(true); // Default value
      expect(role.isSystem).toBe(false); // Default value
    });

    it('should validate required fields', async () => {
      const role = new Role({});

      await expect(role.save()).rejects.toThrow();
    });

    it('should enforce unique role names', async () => {
      const roleData = {
        name: 'duplicate-role',
        displayName: 'Duplicate Role',
        permissions: ['read']
      };

      const role1 = new Role(roleData);
      await role1.save();

      const role2 = new Role(roleData);
      await expect(role2.save()).rejects.toThrow();
    });

    it('should find role by name', async () => {
      const roleData = {
        name: 'findable-role',
        displayName: 'Findable Role',
        permissions: ['read']
      };

      const role = new Role(roleData);
      await role.save();

      const foundRole = await Role.findByName('findable-role');
      expect(foundRole).toBeTruthy();
      expect(foundRole.name).toBe('findable-role');
    });

    it('should check if role has permission', () => {
      const role = new Role({
        name: 'test-role',
        displayName: 'Test Role',
        permissions: ['read', 'write', 'delete']
      });

      expect(role.hasPermission('read')).toBe(true);
      expect(role.hasPermission('write')).toBe(true);
      expect(role.hasPermission('admin')).toBe(false);
    });

    it('should add and remove permissions', () => {
      const role = new Role({
        name: 'test-role',
        displayName: 'Test Role',
        permissions: ['read']
      });

      // Add permission
      role.addPermission('write');
      expect(role.permissions).toContain('write');

      // Don't add duplicate
      role.addPermission('write');
      expect(role.permissions.filter(p => p === 'write')).toHaveLength(1);

      // Remove permission
      role.removePermission('read');
      expect(role.permissions).not.toContain('read');
    });

    it('should convert name to lowercase', async () => {
      const role = new Role({
        name: 'UPPERCASE-ROLE',
        displayName: 'Uppercase Role',
        permissions: ['read']
      });

      await role.save();
      expect(role.name).toBe('uppercase-role');
    });
  });

  describe('User-Role Integration', () => {
    it('should assign roles to users', async () => {
      const role = new Role({
        name: 'test-role',
        displayName: 'Test Role',
        permissions: ['read', 'write']
      });
      await role.save();

      const user = await createTestUser();
      await user.addRole(role._id);

      expect(user.roles).toContain(role._id);
    });

    it('should compute effective permissions from roles', async () => {
      const role = new Role({
        name: 'test-role',
        displayName: 'Test Role',
        permissions: ['read', 'write']
      });
      await role.save();

      const user = await createTestUser();
      user.roles.push(role._id);
      user.permissions.push('custom_permission');

      await user.computeEffectivePermissions();

      expect(user.effectivePermissions).toContain('read');
      expect(user.effectivePermissions).toContain('write');
      expect(user.effectivePermissions).toContain('custom_permission');
    });

    it('should check permissions correctly', async () => {
      const role = new Role({
        name: 'test-role',
        displayName: 'Test Role',
        permissions: ['manage_users']
      });
      await role.save();

      const user = await createTestUser();
      user.roles.push(role._id);
      await user.computeEffectivePermissions();

      expect(user.hasPermission('manage_users')).toBe(true);
      expect(user.hasPermission('non_existent')).toBe(false);
    });
  });
});