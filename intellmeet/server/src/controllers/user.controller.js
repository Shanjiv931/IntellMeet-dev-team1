import User from '../models/User.model.js';
import UserSettings from '../models/UserSettings.model.js';
import Session from '../models/Session.model.js';
import Task from '../models/Task.model.js';
import Meeting from '../models/Meeting.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Get user settings. If not initialized, creates defaults.
 * GET /api/users/settings
 */
export const getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let settings = await UserSettings.findOne({ user: userId });

    if (!settings) {
      settings = await UserSettings.create({ user: userId });
    }

    res.status(200).json({
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
    const userId = req.user._id || req.user.id;
    
    // Disallow overriding the user reference
    delete req.body.user;

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: req.body },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({
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
    const userId = req.user._id || req.user.id;
    const { name, email, avatar } = req.body;

    if (!name || !email) {
      throw new AppError('Name and email are required fields.', 400);
    }

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

    res.status(200).json({
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
    const userId = req.user._id || req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError('Both old and new passwords must be provided.', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 400);
    }

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

    res.status(200).json({
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
    const userId = req.user._id || req.user.id;

    logger.warn(`Initiating account termination pipeline for user: ${userId}`);

    // Delete tasks, meetings, settings, sessions, and user
    await Task.deleteMany({ creator: userId });
    await Meeting.deleteMany({ host: userId });
    await UserSettings.deleteMany({ user: userId });
    await Session.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    logger.info(`Clean cascading account deletion completed for user ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Account terminated and deleted successfully from MongoDB.'
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
    const userId = req.user._id || req.user.id;
    const sessions = await Session.find({ user: userId }).sort({ lastActive: -1 });

    res.status(200).json({
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
    const userId = req.user._id || req.user.id;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new AppError('Session not found or unauthorized to revoke.', 404);
    }

    await Session.findByIdAndDelete(sessionId);

    res.status(200).json({
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
    const userId = req.user._id || req.user.id;
    const authHeader = req.headers.authorization;
    const currentToken = authHeader ? authHeader.split(' ')[1] : null;

    if (currentToken) {
      await Session.deleteMany({ user: userId, token: { $ne: currentToken } });
    } else {
      await Session.deleteMany({ user: userId });
    }

    res.status(200).json({
      success: true,
      message: 'All other active devices signed out successfully.'
    });
  } catch (error) {
    next(error);
  }
};
