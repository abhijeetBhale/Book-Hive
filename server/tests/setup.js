import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import redisClient from '../config/redis.js';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri);
  
  // Connect to Redis (use test database)
  if (process.env.REDIS_URL_TEST) {
    process.env.REDIS_URL = process.env.REDIS_URL_TEST;
  }
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear Redis test data
  try {
    if (redisClient.isConnected) {
      await redisClient.client.flushdb();
    }
  } catch (error) {
    console.warn('Redis cleanup failed:', error.message);
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  // Close Redis connection
  try {
    await redisClient.disconnect();
  } catch (error) {
    console.warn('Redis disconnect failed:', error.message);
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);