const { verifyToken } = require('../utils/jwt');
const { getStaffDetailsWithPermissions } = require('../services/authService');
const { errorResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Authentication middleware to verify JWT and attach user context
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if Authorization header is present and format matches 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication token required', HTTP_STATUS.UNAUTHORIZED);
    }

    // 2. Verify the JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
      }
      return errorResponse(res, 'Invalid authentication token', HTTP_STATUS.UNAUTHORIZED);
    }

    // 3. Extract staff_id and role_id
    const staffId = decoded.staff_id || decoded.id;
    if (!staffId) {
      return errorResponse(res, 'Invalid token payload', HTTP_STATUS.UNAUTHORIZED);
    }

    // 4. Fetch staff details and check active status
    const staffDetails = await getStaffDetailsWithPermissions(staffId);
    if (!staffDetails || !staffDetails.user) {
      return errorResponse(res, 'User account not found', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!staffDetails.is_active) {
      return errorResponse(res, 'Your account has been deactivated. Please contact an administrator.', HTTP_STATUS.FORBIDDEN);
    }

    // 5. Attach authenticated user information
    req.user = staffDetails.user;
    req.permissions = staffDetails.permissions;
    req.permissionSlugs = staffDetails.permissionSlugs;
    req.screens = staffDetails.screens;

    // 6. Continue to next middleware
    next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authMiddleware;
