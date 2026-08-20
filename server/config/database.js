import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI environment variable is not set');
      return null;
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    let conn;
    try {
      conn = await mongoose.connect(process.env.MONGODB_URI, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('⚠️ Could not connect to primary MongoDB URI. Attempting in-memory MongoDB server...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          conn = await mongoose.connect(mongoUri, options);
          console.log(`✅ In-Memory MongoDB Connected at ${conn.connection.host}`);
          return conn;
        } catch (memErr) {
          console.warn('⚠️ Could not connect to MongoDB. Running server without database connection.');
          return null;
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    return null;
  }
};

export default connectDatabase;