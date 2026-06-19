import User from '../models/User.model.js';
import UserSettings from '../models/UserSettings.model.js';
import Session from '../models/Session.model.js';
import Task from '../models/Task.model.js';
import Meeting from '../models/Meeting.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { memoryStore, isDBConnected } from '../utils/memoryStore.js';

/**
 * Get user settings. If not initialized, creates defaults.
 * GET /api/users/settings
 */
export const getUserSettings = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (isDBConnected()) {
      let settings = await UserSettings.findOne({ user: userId });
      if (!settings) {
        settings = await UserSettings.create({ user: userId });
      }
      return res.status(200).json({
        success: true,
        data: { settings }
      });
    }

    // Fallback: In-memory store settings
    let settings = memoryStore.settings.find(s => s.user === userId);
    if (!settings) {
      settings = {
        _id: new mongoose.Types.ObjectId().toString(),
        user: userId,
        theme: 'light',
        notifications: {
          email: true,
          meetingReminders: true,
          taskUpdates: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.settings.push(settings);
    }

    return res.status(200).json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user settings
 * PUT /api/users/settings
 */
export const updateUserSettings = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    
    // Disallow overriding the user reference
    delete req.body.user;

    if (isDBConnected()) {
      const settings = await UserSettings.findOneAndUpdate(
        { user: userId },
        { $set: req.body },
        { new: true, runValidators: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully.',
        data: { settings }
      });
    }

    // Fallback: In-memory store settings
    let index = memoryStore.settings.findIndex(s => s.user === userId);
    let settings;
    if (index === -1) {
      settings = {
        _id: new mongoose.Types.ObjectId().toString(),
        user: userId,
        theme: 'light',
        notifications: {
          email: true,
          meetingReminders: true,
          taskUpdates: true
        },
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.settings.push(settings);
    } else {
      memoryStore.settings[index] = {
        ...memoryStore.settings[index],
        ...req.body,
        updatedAt: new Date()
      };
      settings = memoryStore.settings[index];
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile details
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { name, email, avatar } = req.body;

    if (!name || !email) {
      throw new AppError('Name and email are required fields.', 400);
    }

    if (isDBConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found.', 404);
      }

      // Check if email is changing and if it is already taken
      if (email.toLowerCase().trim() !== user.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (emailExists) {
          throw new AppError('Email address is already in use by another account.', 409);
        }
        user.email = email.toLowerCase().trim();
      }

      user.name = name;
      if (avatar !== undefined) {
        user.avatar = avatar;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt
          }
        }
      });
    }

    // Fallback: In-memory store profile update
    const user = memoryStore.users.find(u => u._id.toString() === userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (email.toLowerCase().trim() !== user.email) {
      const emailExists = memoryStore.users.some(u => u.email === email.toLowerCase().trim());
      if (emailExists) {
        throw new AppError('Email address is already in use by another account.', 409);
      }
      user.email = email.toLowerCase().trim();
    }

    user.name = name;
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    user.updatedAt = new Date();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || '',
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change account password
 * PUT /api/users/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError('Both old and new passwords must be provided.', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 400);
    }

    if (isDBConnected()) {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AppError('User session expired or not found.', 404);
      }

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        throw new AppError('Invalid current password verification.', 401);
      }

      user.password = newPassword; // Automatically hashed by pre-save hooks
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password rotated successfully.'
      });
    }

    // Fallback: In-memory store password change
    const user = memoryStore.users.find(u => u._id.toString() === userId);
    if (!user) {
      throw new AppError('User session expired or not found.', 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new AppError('Invalid current password verification.', 401);
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date();

    return res.status(200).json({
      success: true,
      message: 'Password rotated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User Account Cascading Pipeline
 * DELETE /api/users/account
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    logger.warn(`Initiating account termination pipeline for user: ${userId}`);

    if (isDBConnected()) {
      // Delete tasks, meetings, settings, sessions, and user
      await Task.deleteMany({ creator: userId });
      await Meeting.deleteMany({ host: userId });
      await UserSettings.deleteMany({ user: userId });
      await Session.deleteMany({ user: userId });
      await User.findByIdAndDelete(userId);

      logger.info(`Clean cascading account deletion completed for user ID: ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Account terminated and deleted successfully from MongoDB.'
      });
    }

    // Fallback: In-memory store cascading delete
    memoryStore.tasks = memoryStore.tasks.filter(t => t.creator.toString() !== userId && t.assignee?.toString() !== userId);
    memoryStore.meetings = memoryStore.meetings.filter(m => m.host.toString() !== userId && !m.participants.some(p => p.toString() === userId));
    memoryStore.settings = memoryStore.settings.filter(s => s.user.toString() !== userId);
    memoryStore.sessions = memoryStore.sessions.filter(s => s.user.toString() !== userId);
    memoryStore.users = memoryStore.users.filter(u => u._id.toString() !== userId);

    logger.info(`Clean cascading in-memory account deletion completed for user ID: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Account terminated and deleted successfully from Memory Store.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active sessions
 * GET /api/users/sessions
 */
export const getSessions = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (isDBConnected()) {
      const sessions = await Session.find({ user: userId }).sort({ lastActive: -1 });
      return res.status(200).json({
        success: true,
        data: { sessions }
      });
    }

    // Fallback: In-memory sessions
    const sessions = memoryStore.sessions.filter(s => s.user.toString() === userId);
    return res.status(200).json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate specific login session
 * DELETE /api/users/sessions/:id
 */
export const terminateSession = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const sessionId = req.params.id;

    if (isDBConnected()) {
      const session = await Session.findOne({ _id: sessionId, user: userId });
      if (!session) {
        throw new AppError('Session not found or unauthorized to revoke.', 404);
      }

      await Session.findByIdAndDelete(sessionId);

      return res.status(200).json({
        success: true,
        message: 'Session revoked successfully.'
      });
    }

    // Fallback: In-memory terminate session
    const index = memoryStore.sessions.findIndex(s => s._id.toString() === sessionId && s.user.toString() === userId);
    if (index === -1) {
      throw new AppError('Session not found or unauthorized to revoke.', 404);
    }

    memoryStore.sessions.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate all other sessions except current active request
 * DELETE /api/users/sessions
 */
export const terminateAllOtherSessions = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const authHeader = req.headers.authorization;
    const currentToken = authHeader ? authHeader.split(' ')[1] : null;

    if (isDBConnected()) {
      if (currentToken) {
        await Session.deleteMany({ user: userId, token: { $ne: currentToken } });
      } else {
        await Session.deleteMany({ user: userId });
      }

      return res.status(200).json({
        success: true,
        message: 'All other active devices signed out successfully.'
      });
    }

    // Fallback: In-memory terminate all other sessions
    if (currentToken) {
      memoryStore.sessions = memoryStore.sessions.filter(s => s.user.toString() !== userId || s.token === currentToken);
    } else {
      memoryStore.sessions = memoryStore.sessions.filter(s => s.user.toString() !== userId);
    }

    return res.status(200).json({
      success: true,
      message: 'All other active devices signed out successfully.'
    });
  } catch (error) {
    next(error);
  }
};
