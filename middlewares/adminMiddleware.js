const { errorResponse } = require('../utils/response');

/**
 * Middleware to restrict access exclusively to Admin staff
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  if (!req.user.role || req.user.role.slug !== 'admin') {
    return errorResponse(res, 'Forbidden: Admin privilege required', 403);
  }

  next();
};

module.exports = requireAdmin;
