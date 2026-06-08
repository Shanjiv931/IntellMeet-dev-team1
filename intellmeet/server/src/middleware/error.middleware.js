import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Handle Mongoose CastError (e.g. invalid ID formatting)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return { status: 400, message };
};

/**
 * Handle Mongoose Duplicate Key Error (e.g. email already exists)
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : '';
  const message = `Duplicate value: ${value}. Please use another value.`;
  return { status: 409, message };
};

/**
 * Handle Mongoose Schema Validation Errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return { status: 400, message };
};

/**
 * Handle JWT Invalid Signature Errors
 */
const handleJWTError = () => ({
  status: 401,
  message: 'Invalid authorization token. Please login again.',
});

/**
 * Handle JWT Expiration Errors
 */
const handleJWTExpiredError = () => ({
  status: 401,
  message: 'Your login session has expired. Please log in again.',
});

/**
 * Global centralized Express error handler middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Map JWT validation errors to 401 Unauthorized
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    err.statusCode = 401;
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error using structured logger
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err);

  if (env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.statusCode,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production Mode: Shield internal server details, return polished client-friendly errors
    let errorResponse = {
      statusCode: err.statusCode,
      message: err.isOperational ? err.message : 'Something went wrong. Please try again later.',
    };

    // Intercept database & JWT errors to convert them into descriptive operational errors
    if (err.name === 'CastError') {
      const dbErr = handleCastErrorDB(err);
      errorResponse.statusCode = dbErr.status;
      errorResponse.message = dbErr.message;
    } else if (err.code === 11000) {
      const dbErr = handleDuplicateFieldsDB(err);
      errorResponse.statusCode = dbErr.status;
      errorResponse.message = dbErr.message;
    } else if (err.name === 'ValidationError') {
      const dbErr = handleValidationErrorDB(err);
      errorResponse.statusCode = dbErr.status;
      errorResponse.message = dbErr.message;
    } else if (err.name === 'JsonWebTokenError') {
      const jwtErr = handleJWTError();
      errorResponse.statusCode = jwtErr.status;
      errorResponse.message = jwtErr.message;
    } else if (err.name === 'TokenExpiredError') {
      const jwtErr = handleJWTExpiredError();
      errorResponse.statusCode = jwtErr.status;
      errorResponse.message = jwtErr.message;
    }

    res.status(errorResponse.statusCode).json({
      success: false,
      status: errorResponse.statusCode,
      error: errorResponse.statusCode === 500 ? 'InternalServerError' : 'OperationalError',
      message: errorResponse.message,
    });
  }
};

export default errorMiddleware;
