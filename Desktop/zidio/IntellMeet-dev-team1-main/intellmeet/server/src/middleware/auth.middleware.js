import { verifyAccessToken } from '../utils/jwt.utils.js';
import { getUserById } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';

/**
 * Authentication Middleware: Protects endpoints by validating the JWT token in Authorization header.
 * Attaches the fully resolved User object to req.user (excluding the password).
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No authorization token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify Access Token (throws error if signature or expiry is invalid)
    const decoded = verifyAccessToken(token);

    // Fetch the user (utilizes MongoDB Atlas or offline memory fallback)
    const user = await getUserById(decoded.id);


    // Attach user information to request context
    req.user = user;
    next();
  } catch (error) {
    // Pass errors directly to centralized global error handler
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware: Restricts access to specific roles.
 * Must be positioned AFTER authenticateJWT middleware.
 * @param {...string} allowedRoles - Set of roles permitted to access endpoint (e.g. 'ADMIN', 'MEMBER')
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication context missing on role assertion.', 500));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden access. Your current role (${req.user.role}) does not have permission to execute this action.`,
          403
        )
      );
    }

    next();
  };
};
