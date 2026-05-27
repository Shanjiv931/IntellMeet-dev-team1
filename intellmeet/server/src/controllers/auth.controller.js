import * as authService from '../services/auth.service.js';
import AppError from '../utils/AppError.js';

/**
 * Handle new user registration requests
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Direct input validation at the API controller boundary
    if (!name || !email || !password) {
      throw new AppError('Missing required inputs: name, email, and password must all be provided.', 400);
    }

    // Delegate database processing to the service layer
    const result = await authService.registerUser({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error); // Forward to centralized error handler middleware
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

    // Delegate authentication challenge to service layer
    const result = await authService.loginUser({ email, password });

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
    // req.user has already been resolved by authenticateJWT middleware
    if (!req.user) {
      throw new AppError('Authentication context missing.', 500);
    }

    res.status(200).json({
      success: true,
      message: 'User session verified.',
      data: {
        user: {
          id: req.user._id,
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
