const { errorResponse } = require('../utils/response');

/**
 * Reusable permission middleware to enforce role-based permission checks
 * @param {string|string[]} requiredPermissions - Single slug or array of permission slugs
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // 2. Admin role has unrestricted access
    if (req.user.role && req.user.role.slug === 'admin') {
      return next();
    }

    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const userPermSlugs = req.permissionSlugs || [];

    // 3. Check if user's role has at least one of the required permissions
    const hasPermission = permissions.some(perm => userPermSlugs.includes(perm));

    if (!hasPermission) {
      return errorResponse(
        res,
        `Forbidden: Insufficient permissions (${permissions.join(', ')})`,
        403
      );
    }

    next();
  };
};

module.exports = requirePermission;
