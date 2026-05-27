import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const connectDB = async (attempt = 1) => {
  try {
    logger.info(`Attempting MongoDB Atlas connection (Attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`);
    
    // Explicitly configure Mongoose options for production-grade reliability
    const options = {
      autoIndex: true, // Auto-build indexes (disable in high-load production if index builds degrade performance, but excellent for Week 1)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const connection = await mongoose.connect(env.MONGO_URI, options);
    
    logger.info(`MongoDB connected successfully to host: ${connection.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failure on attempt ${attempt}:`, error);

    if (attempt < MAX_RETRY_ATTEMPTS) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      logger.warn(`Retrying database connection in ${delay}ms...`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      logger.error('CRITICAL: Max database connection attempts reached. Terminating process...');
      process.exit(1);
    }
  }
};

// Monitor Connection States
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB runtime connection error encountered:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB database connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB database connection successfully re-established.');
});

// Graceful Shutdown Handler
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Atlas connection closed gracefully.');
  } catch (error) {
    logger.error('Error occurred while closing MongoDB Atlas connection:', error);
  }
};
