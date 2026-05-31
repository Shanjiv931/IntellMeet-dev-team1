import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Meeting from '../models/Meeting.model.js';
import logger from '../utils/logger.js';

const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Silent Self-Healing Database Boot Seeder
 * Compiles schemas, compiles unique index rules (creating collections), and seeds admin account + completed meetings.
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
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      logger.info(`🌱 Seed account '${adminEmail}' not found. Initializing seed...`);
      
      admin = await User.create({
        name: 'IntellMeet Admin',
        email: adminEmail,
        password: 'Password123!', // Automatically hashed by User model hooks
        role: 'ADMIN'
      });

      logger.info('🚀 Database auto-seed successful!');
      logger.info('----------------------------------------------');
      logger.info(`Email:    ${admin.email}`);
      logger.info('Password: Password123!');
      logger.info('Role:     ADMIN');
      logger.info('----------------------------------------------');
    }

    // 3. Seed Sample Completed Meetings for the Admin User if empty
    const completedCount = await Meeting.countDocuments({ host: admin._id, status: 'COMPLETED' });
    if (completedCount === 0) {
      logger.info('🌱 Database seeding completed meetings for Administrator dashboard...');

      await Meeting.create([
        {
          title: 'API Specification & Architecture Review',
          description: 'Finalize core Express endpoint definitions, routing schemes, and whitelisting credentials.',
          host: admin._id,
          participants: [admin._id],
          status: 'COMPLETED',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 mins duration
          summary: 'The technical alignment meeting finalized MERN integration specifications. The tech lead approved the modular controller-service layout; the team whitelisted CORS access rules for Vercel clients. JWT access and refresh token rotates in a secure 15m/7d cycle.',
          transcript: '[00:02] Admin: Let us align on the CORS routing structure.\n[00:15] Lead: We should allow dynamic wildcard matching for Vercel environments to prevent login blocks.\n[00:30] QA: Verified! Token rotation triggers successfully upon expired handshakes.',
          actionItems: [
            { text: 'Create and document mock database tables', completed: true, assignee: 'Admin' },
            { text: 'Verify client checkmarks and auth requirements', completed: false, assignee: 'Admin' },
            { text: 'Configure Redis connection pool parameters', completed: false, assignee: 'Lead' }
          ]
        },
        {
          title: 'Sprint Demo & Client Handshake Run',
          description: 'Dry run presentation for Zidio Development domain inspectors.',
          host: admin._id,
          participants: [admin._id],
          status: 'COMPLETED',
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 mins duration
          summary: 'Successfully presented frontend dashboard view to inspectors. Verified native fetch API hooks, lobby device settings, real-time message relays, and sharded MongoDB collections. Feedback was overwhelmingly positive regarding visual aesthetics and performance.',
          transcript: '[00:01] Admin: Welcome inspectors to the IntellMeet trial.\n[00:10] Inspector: The glassmorphism cards and hover micro-animations look extremely premium.\n[00:28] Lead: Excellent. Dynamic database connection pools resolved.',
          actionItems: [
            { text: 'Whitelist all outward Render server IPs on Atlas', completed: true, assignee: 'Admin' },
            { text: 'Integrate native fetch helper on signup', completed: true, assignee: 'Admin' }
          ]
        }
      ]);

      logger.info('🚀 SEED SUCCESS: 2 completed meetings successfully inserted into MongoDB Atlas!');
    }
  } catch (error) {
    logger.error('❌ Resilient DB Error: Silent database seeding failed:', error);
  }
};
