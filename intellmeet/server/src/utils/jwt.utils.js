import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate a short-lived access JWT token
 * @param {object} payload - User object attributes to sign (id, email, role)
 * @returns {string} Signed JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // Recommended for OAuth/SaaS access tokens
  });
};

/**
 * Generate a long-lived refresh JWT token
 * @param {object} payload - User object attributes to sign (id, email, role)
 * @param {boolean} rememberMe - Whether user requested extended session
 * @returns {string} Signed JWT token
 */
export const generateRefreshToken = (payload, rememberMe = false) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: rememberMe ? '30d' : '7d', // Recommended for session persistence
  });
};

/**
 * Verify access JWT token
 * @param {string} token - Signed JWT access token
 * @returns {object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

/**
 * Verify refresh JWT token
 * @param {string} token - Signed JWT refresh token
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

/**
 * Generate a short-lived password reset JWT token
 * @param {object} payload - User object attributes to sign (id, email)
 * @returns {string} Signed JWT token
 */
export const generateResetToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '10m', // Recommended for password reset windows
  });
};

/**
 * Verify password reset JWT token
 * @param {string} token - Signed JWT reset token
 * @returns {object} Decoded token payload
 */
export const verifyResetToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
