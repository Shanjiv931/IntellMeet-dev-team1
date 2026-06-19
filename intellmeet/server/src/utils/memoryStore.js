import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '..', '..', 'local_fallback_db.json');

const rawMemoryStore = {
  users: [],
  meetings: [],
  tasks: [],
  settings: [],
  sessions: [],
  notifications: []
};

// Check if we are currently loading, to avoid saving during loadFromDisk
let isLoading = false;

export const saveToDisk = () => {
  if (isLoading) return;
  try {
    const dataToSave = {
      users: rawMemoryStore.users,
      meetings: rawMemoryStore.meetings,
      tasks: rawMemoryStore.tasks,
      settings: rawMemoryStore.settings,
      sessions: rawMemoryStore.sessions,
      notifications: rawMemoryStore.notifications
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf8');
    logger.info('Resilient DB Fallback: Saved memoryStore to disk.');
  } catch (err) {
    logger.error('Failed to save memoryStore to disk:', err);
  }
};

const makeAutosaveArray = (arr, onMutation) => {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
        if (mutatingMethods.includes(prop)) {
          return function(...args) {
            const result = val.apply(target, args);
            onMutation();
            return result;
          };
        }
      }
      return val;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      onMutation();
      return result;
    }
  });
};

export const memoryStore = {
  users: makeAutosaveArray(rawMemoryStore.users, saveToDisk),
  meetings: makeAutosaveArray(rawMemoryStore.meetings, saveToDisk),
  tasks: makeAutosaveArray(rawMemoryStore.tasks, saveToDisk),
  settings: makeAutosaveArray(rawMemoryStore.settings, saveToDisk),
  sessions: makeAutosaveArray(rawMemoryStore.sessions, saveToDisk),
  notifications: makeAutosaveArray(rawMemoryStore.notifications, saveToDisk)
};

export const loadFromDisk = () => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      
      isLoading = true;
      Object.keys(parsed).forEach(key => {
        if (Array.isArray(parsed[key]) && memoryStore[key]) {
          memoryStore[key].length = 0;
          memoryStore[key].push(...parsed[key]);
        }
      });
      isLoading = false;
      logger.info('Resilient DB Fallback: Loaded memoryStore from disk.');
    } else {
      logger.info('Resilient DB Fallback: No database file found on disk, starting fresh.');
    }
  } catch (err) {
    isLoading = false;
    logger.error('Failed to load memoryStore from disk:', err);
  }
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

// Load existing data from disk first
loadFromDisk();

// Run initialization immediately
initializeMemoryAdmin();
