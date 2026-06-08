import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import logger from '../utils/logger.js';

// Resilient in-memory database store for users when MongoDB is offline
const memoryUsers = [];

const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Register a new user in MongoDB Atlas (with in-memory fallback)
 */
export const registerUser = async ({ name, email, password, role, userAgent, ipAddress }) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (isDBConnected()) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('Email address is already registered in the system.', 409);
    }

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role || 'MEMBER',
    });

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar || '',
      createdAt: newUser.createdAt,
    };

    const payload = { id: newUser._id, email: newUser.email, role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await Session.create({
      user: newUser._id,
      token: accessToken,
      device: userAgent || 'Unknown Device',
      ipAddress: ipAddress || 'Unknown IP'
    });

    return {
      user: userResponse,
      tokens: { accessToken, refreshToken },
    };
  }

  // Memory mode fallback
  const existingMemoryUser = memoryUsers.find(u => u.email === normalizedEmail);
  if (existingMemoryUser) {
    throw new AppError('Email address is already registered in the system.', 409);
  }

  // Hash password using bcryptjs manually for local memory storage
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const mockUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: role || 'MEMBER',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  memoryUsers.push(mockUser);
  logger.info(`Resilient DB Fallback: Registered user in-memory: ${mockUser._id}`);

  const userResponse = {
    id: mockUser._id,
    name: mockUser.name,
    email: mockUser.email,
    role: mockUser.role,
    createdAt: mockUser.createdAt
  };

  const payload = { id: mockUser._id, email: mockUser.email, role: mockUser.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: userResponse,
    tokens: { accessToken, refreshToken }
  };
};

/**
 * Login a user by validating credentials (with in-memory fallback)
 */
export const loginUser = async ({ email, password, userAgent, ipAddress }) => {
  if (!email || !password) {
    throw new AppError('Please provide both email and password to log in.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (isDBConnected()) {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password. Please try again.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password. Please try again.', 401);
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      createdAt: user.createdAt,
    };

    const payload = { id: user._id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await Session.create({
      user: user._id,
      token: accessToken,
      device: userAgent || 'Unknown Device',
      ipAddress: ipAddress || 'Unknown IP'
    });

    return {
      user: userResponse,
      tokens: { accessToken, refreshToken },
    };
  }

  // Memory mode fallback
  const user = memoryUsers.find(u => u.email === normalizedEmail);
  if (!user) {
    throw new AppError('Invalid email or password. Please try again.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password. Please try again.', 401);
  }

  logger.info(`Resilient DB Fallback: User login verified in-memory: ${user._id}`);

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: userResponse,
    tokens: { accessToken, refreshToken }
  };
};

/**
 * Fetch user profile by ID
 */
export const getUserById = async (userId) => {
  if (isDBConnected()) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Requested user session could not be found.', 404);
    }
    return user;
  }

  // Memory mode fallback
  const user = memoryUsers.find(u => u._id.toString() === userId.toString());
  if (!user) {
    throw new AppError('Requested user session could not be found.', 404);
  }
  return user;
};

/**
 * Refresh user access and refresh tokens
 */
export const refreshUserTokens = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await getUserById(decoded.id);

    const payload = { id: user._id || user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
  }
};
