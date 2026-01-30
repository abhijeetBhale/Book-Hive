import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';

/**
 * Create a test user with specified role and permissions
 */
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true,
    ...userData
  };

  // Don't hash password here - let the pre-save hook handle it
  const user = new User(defaultUser);
  await user.save();
  return user;
};

/**
 * Create an admin test user
 */
export const createAdminUser = async (userData = {}) => {
  return createTestUser({
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_users'],
    ...userData
  });
};

/**
 * Generate JWT token for test user
 */
export const generateTestToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET_TEST || process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};

/**
 * Create authorization header for tests
 */
export const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

/**
 * Create test book data
 */
export const createTestBook = (bookData = {}) => {
  return {
    title: 'Test Book',
    author: 'Test Author',
    description: 'A test book description',
    category: 'Fiction',
    condition: 'Good',
    isAvailable: true,
    ...bookData
  };
};

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock Redis for tests that don't need actual Redis
 */
export const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(false),
  ping: jest.fn().mockResolvedValue(true),
  isConnected: true
};

/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
  // This is handled in setup.js afterEach
  // But can be called manually if needed
  const collections = ['users', 'books', 'borrowrequests'];
  
  for (const collection of collections) {
    try {
      await mongoose.connection.collection(collection).deleteMany({});
    } catch (error) {
      console.warn(`Failed to cleanup ${collection}:`, error.message);
    }
  }
};