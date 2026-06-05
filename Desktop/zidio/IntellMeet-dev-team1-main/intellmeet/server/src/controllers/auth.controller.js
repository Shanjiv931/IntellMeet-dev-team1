import * as authService from '../services/auth.service.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Handle new user registration requests
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Missing required inputs: name, email, and password must all be provided.', 400);
    }

    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || 'Unknown IP';

    const result = await authService.registerUser({ name, email, password, role, userAgent, ipAddress });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user session login requests
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Missing credentials. Please supply email and password.', 400);
    }

    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || 'Unknown IP';

    const result = await authService.loginUser({ email, password, userAgent, ipAddress });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve current authenticated user profile info
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication context missing.', 500);
    }

    res.status(200).json({
      success: true,
      message: 'User session verified.',
      data: {
        user: {
          id: req.user._id || req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh expired session access tokens
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Missing refresh token parameter.', 400);
    }

    const result = await authService.refreshUserTokens(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Session token refreshed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resilient Avatar Upload / Setup endpoint
 * POST /api/auth/avatar
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    const userId = req.user._id || req.user.id;

    // Fetch user and update avatar details in database
    const user = await authService.getUserById(userId);
    
    // Fallback: If DB connected, update. If memory mode, we update our memory instance
    user.avatar = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
    
    if (typeof user.save === 'function') {
      await user.save();
    }

    logger.info(`Profile avatar updated for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Avatar profile image configured.',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};
