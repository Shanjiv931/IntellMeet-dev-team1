/**
 * Standardized Operational Error Class for IntellMeet SaaS Backend.
 * Allows throwing explicit HTTP status codes along with custom descriptive messages.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Identifies expected client-facing errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
