const { errorResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Middleware to restrict access exclusively to Admin staff
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!req.user.role || req.user.role.slug !== 'admin') {
    return errorResponse(res, 'Forbidden: Admin privilege required', HTTP_STATUS.FORBIDDEN);
  }

  next();
};

module.exports = requireAdmin;
