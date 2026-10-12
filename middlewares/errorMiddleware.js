const { errorResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Global Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error on backend for debugging
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';

  // Handle Sequelize specific errors cleanly
  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, 'A record with this information already exists', HTTP_STATUS.CONFLICT);
  }

  if (err.name === 'SequelizeValidationError') {
    const errorDetails = err.errors ? err.errors.map(e => e.message).join(', ') : 'Validation error';
    return errorResponse(res, `Validation error: ${errorDetails}`, HTTP_STATUS.BAD_REQUEST);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 'Referenced record does not exist', HTTP_STATUS.BAD_REQUEST);
  }

  if (err.name === 'SequelizeDatabaseError') {
    return errorResponse(res, 'Invalid database query or data format', HTTP_STATUS.BAD_REQUEST);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token', HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired', HTTP_STATUS.UNAUTHORIZED);
  }

  // Prevent internal error leaking in production for generic 500s
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  return errorResponse(res, message, statusCode);
};

module.exports = errorMiddleware;
