import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';
import Meeting from '../models/Meeting.model.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('CRITICAL: MONGO_URI is missing from environment. Database seeding aborted.');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    logger.info('==================================================');
    logger.info('Starting MongoDB Connection Verification & Seeding...');
    logger.info(`Connection String: ${MONGO_URI.split('@')[1] ? 'mongodb://***@' + MONGO_URI.split('@')[1] : MONGO_URI}`);
    
    // 1. Establish Connection
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    
    logger.info('SUCCESS: MongoDB Atlas connected successfully.');
    
    // 2. Explicitly Create Collections and Compile Indexes
    logger.info('Compiling Mongoose schemas and building collection indexes...');
    
    await User.createIndexes();
    logger.info('Collection "users" and index constraints established.');
    
    await Meeting.createIndexes();
    logger.info('Collection "meetings" and index constraints established.');

    // 3. Seed Default Admin Account
    logger.info('Checking default seed accounts...');
    const adminEmail = 'admin@intellmeet.app';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      logger.info(`Default admin account '${adminEmail}' not found. Creating seed account...`);
      
      const seedAdmin = await User.create({
        name: 'IntellMeet Admin',
        email: adminEmail,
        password: 'Password123!', // Triggers schema pre-save hashing rounds
        role: 'ADMIN'
      });

      logger.info('SEED SUCCESS: Default admin account created successfully!');
      logger.info('----------------------------------------------');
      logger.info(`Email:    ${seedAdmin.email}`);
      logger.info('Password: Password123!');
      logger.info('Role:     ADMIN');
      logger.info('----------------------------------------------');
    } else {
      logger.info(`Info: Default admin account '${adminEmail}' already exists in database. Skipping seed.`);
    }

    logger.info('Database connection verification and seeding completed successfully!');
    logger.info('==================================================');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('FAILURE: MongoDB verification or seeding failed with error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
