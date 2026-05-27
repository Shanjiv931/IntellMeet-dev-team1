import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';

/**
 * Register a new user in MongoDB Atlas
 * @param {object} userData - Registration parameters (name, email, password, role)
 * @returns {object} Clean user metadata and session tokens
 */
export const registerUser = async ({ name, email, password, role }) => {
  // Validate if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email address is already registered in the system.', 409);
  }

  // Create new user (triggers pre-save hashing)
  const newUser = await User.create({
    name,
    email,
    password,
    role: role || 'MEMBER', // Default is MEMBER, but supports custom role assignments
  });

  // Strip password from returned metadata
  const userResponse = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    createdAt: newUser.createdAt,
  };

  // Generate Session Tokens
  const payload = { id: newUser._id, email: newUser.email, role: newUser.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: userResponse,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Login a user by validating their credentials
 * @param {object} credentials - Login parameters (email, password)
 * @returns {object} Clean user metadata and session tokens
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Please provide both email and password to log in.', 400);
  }

  // Fetch user explicitly selecting the password field (since it is unselected by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password. Please try again.', 401);
  }

  // Compare candidate password with database hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password. Please try again.', 401);
  }

  // Strip password from returned metadata
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  // Generate Session Tokens
  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: userResponse,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Fetch a user profile by MongoDB ObjectId
 * @param {string} userId - Target User ID
 * @returns {object} Clean Mongoose user document
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Requested user session could not be found.', 404);
  }
  return user;
};
