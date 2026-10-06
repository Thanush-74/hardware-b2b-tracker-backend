const { errorResponse } = require('../utils/response');

/**
 * Global Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error on backend for debugging
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Sequelize specific errors cleanly
  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, 'A record with this information already exists', 409);
  }

  if (err.name === 'SequelizeValidationError') {
    const errorDetails = err.errors ? err.errors.map(e => e.message).join(', ') : 'Validation error';
    return errorResponse(res, `Validation error: ${errorDetails}`, 400);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 'Referenced record does not exist', 400);
  }

  if (err.name === 'SequelizeDatabaseError') {
    return errorResponse(res, 'Invalid database query or data format', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired', 401);
  }

  // Prevent internal error leaking in production for generic 500s
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  return errorResponse(res, message, statusCode);
};

module.exports = errorMiddleware;
