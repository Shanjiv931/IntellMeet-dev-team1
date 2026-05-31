import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Meeting from '../models/Meeting.model.js';
import logger from '../utils/logger.js';

const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Silent Self-Healing Database Boot Seeder
 * Compiles schemas, compiles unique index rules (creating collections), and seeds admin account.
 */
export const seedDatabaseSilent = async () => {
  if (!isDBConnected()) {
    logger.warn('⚠️ Resilient DB: MongoDB Atlas is currently offline or running in-memory fallback. Skipping auto-seed.');
    return;
  }

  try {
    logger.info('🪐 Resilient DB: Initiating database self-healing index checks...');

    // 1. Explicitly build collection index structures in MongoDB
    await User.createIndexes();
    await Meeting.createIndexes();
    logger.info('✅ Collection structures and index constraints successfully synchronized.');

    // 2. Auto-seed Default Administrator Account if missing
    const adminEmail = 'admin@intellmeet.app';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      logger.info(`🌱 Seed account '${adminEmail}' not found. Initializing seed...`);
      
      const seedAdmin = await User.create({
        name: 'IntellMeet Admin',
        email: adminEmail,
        password: 'Password123!', // Automatically hashed by User model hooks
        role: 'ADMIN'
      });

      logger.info('🚀 Database auto-seed successful!');
      logger.info('----------------------------------------------');
      logger.info(`Email:    ${seedAdmin.email}`);
      logger.info('Password: Password123!');
      logger.info('Role:     ADMIN');
      logger.info('----------------------------------------------');
    } else {
      logger.debug(`Seed account '${adminEmail}' is active in MongoDB.`);
    }
  } catch (error) {
    logger.error('❌ Resilient DB Error: Silent database seeding failed:', error);
    // Graceful catch: Allow server to continue booting even if seeding logs are read-only
  }
};
