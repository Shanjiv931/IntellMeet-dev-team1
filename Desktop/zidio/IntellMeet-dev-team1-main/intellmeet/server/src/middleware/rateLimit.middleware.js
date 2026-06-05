import rateLimit from 'express-rate-limit';

/**
 * Structured Rate Limiting helper.
 * Provides custom response formats and HTTP 429 status codes.
 */
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      res.status(429).json({
        success: false,
        status: 429,
        error: 'Too Many Requests',
        message: message || options.message,
      });
    },
    // Trust proxy settings (required on cloud providers like Render, Heroku, Fly.io)
    // Note: Trust proxy must be configured on the Express app layer as well
  });
};

// Protect authentications paths from brute force (e.g., login, register)
export const authRateLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  30,             // Limit each IP to 30 requests per window
  'Too many login or registration attempts. Please try again after 15 minutes.'
);

// General protection for other API resource routes
export const apiRateLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  250,            // Limit each IP to 250 requests per window
  'Too many API requests from this client. Please slow down.'
);
