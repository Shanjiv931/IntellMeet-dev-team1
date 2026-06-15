import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from './logger.js';

export const memoryStore = {
  users: [],
  meetings: [],
  tasks: [],
  settings: [],
  sessions: []
};

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const initializeMemoryAdmin = async () => {
  // Ensure default admin exists
  const adminEmail = 'admin@intellmeet.app';
  const hasAdmin = memoryStore.users.some(u => u.email === adminEmail);
  
  if (!hasAdmin) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Password123!', salt);
      memoryStore.users.push({
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'IntellMeet Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      logger.info('Resilient DB Fallback: Centralized memory admin user pre-seeded.');
    } catch (err) {
      logger.error('Failed to initialize centralized memory admin:', err);
    }
  }
};

// Run initialization immediately
initializeMemoryAdmin();
