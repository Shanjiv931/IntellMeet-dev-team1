import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateResetToken, verifyResetToken } from '../utils/jwt.utils.js';
import logger from '../utils/logger.js';

export const validatePasswordComplexity = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':",./\\|?~`<>]/;

  return password && password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSymbol.test(password);
};

/**
 * Register a new user in MongoDB Atlas
 */
export const registerUser = async ({ name, email, password, role, userAgent, ipAddress, rememberMe = false }) => {
  if (!name || !name.trim() || name.trim().length < 2 || name.trim().length > 50) {
    throw new AppError('Name must be between 2 and 50 characters long.', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (!password || !validatePasswordComplexity(password)) {
    throw new AppError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.', 400);
  }

  if (role && !['ADMIN', 'MEMBER', 'GUEST'].includes(role)) {
    throw new AppError('Invalid role specified.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

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
  const refreshToken = generateRefreshToken(payload, rememberMe);

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
};

/**
 * Login a user by validating credentials
 */
export const loginUser = async ({ email, password, userAgent, ipAddress, rememberMe = false }) => {
  if (!email || !password) {
    throw new AppError('Please provide both email and password to log in.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new AppError('Email address not found. Please register.', 404);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Incorrect password. Please try again.', 401);
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
  const refreshToken = generateRefreshToken(payload, rememberMe);

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
};

/**
 * Fetch user profile by ID
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
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
    
    // Check if original token was signed with long duration (e.g. 30 days)
    const isLongLived = decoded.exp && decoded.iat && (decoded.exp - decoded.iat >= 29 * 24 * 60 * 60);
    const newRefreshToken = generateRefreshToken(payload, isLongLived);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
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

/**
 * Handle password reset request by generating a stateless reset token
 */
export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('Email address not found. Please register.', 404);
  }

  const payload = { id: user._id || user.id, email: user.email };
  const token = generateResetToken(payload);

  logger.info(`[Forgot Password] Reset token generated for ${user.email}: ${token}`);

  return {
    token,
    email: user.email,
    resetLink: `http://localhost:5173/reset-password?token=${token}`
  };
};

/**
 * Verify reset token and update user password in MongoDB
 */
export const resetPassword = async (token, password) => {
  if (!token) {
    throw new AppError('Password reset token is missing.', 400);
  }

  if (!password || !validatePasswordComplexity(password)) {
    throw new AppError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.', 400);
  }

  let decoded;
  try {
    decoded = verifyResetToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired reset token. Please request a new link.', 400);
  }

  const userId = decoded.id;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User account not found.', 404);
  }
  user.password = password; // Hashed automatically by pre-save hooks
  await user.save();
  await Session.deleteMany({ user: user._id });

  logger.info(`[Forgot Password] Password successfully reset for user ID: ${userId}`);
  return true;
};
