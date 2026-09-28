const { Staff, Role, Permission, Screen, RolePermission } = require('../models');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

/**
 * Fetch staff details along with role, permissions, and permitted screens
 * @param {number|string} staffId
 */
const getStaffDetailsWithPermissions = async (staffId) => {
  const staff = await Staff.findByPk(staffId, {
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: Permission,
            as: 'permissions',
            include: [
              {
                model: Screen,
                as: 'screen'
              }
            ]
          }
        ]
      }
    ]
  });

  if (!staff) return null;

  const role = staff.role;
  const permissions = [];
  const screenMap = new Map();

  if (role && Array.isArray(role.permissions)) {
    role.permissions.forEach(perm => {
      permissions.push({
        id: Number(perm.id),
        name: perm.name,
        slug: perm.slug,
        action: perm.action
      });

      if (perm.screen && perm.screen.is_active !== false) {
        const scr = perm.screen;
        const screenId = Number(scr.id);
        if (!screenMap.has(screenId)) {
          screenMap.set(screenId, {
            id: screenId,
            name: scr.name,
            slug: scr.slug,
            route: scr.route
          });
        }
      }
    });
  }

  // Deduplicate and sort screens by id
  const screens = Array.from(screenMap.values()).sort((a, b) => a.id - b.id);
  const permissionSlugs = permissions.map(p => p.slug);

  return {
    user: {
      id: Number(staff.id),
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      role: role ? {
        id: Number(role.id),
        name: role.name,
        slug: role.slug
      } : null
    },
    permissions,
    permissionSlugs,
    screens,
    is_active: staff.is_active
  };
};

/**
 * Handle staff login
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  // 1. Validate that email is provided.
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate that password is provided.
  if (!password || typeof password !== 'string') {
    const error = new Error('Password is required');
    error.statusCode = 400;
    throw error;
  }

  // 3. Normalize the email.
  const normalizedEmail = email.trim().toLowerCase();

  // 4. Find staff using email.
  const staff = await Staff.findOne({
    where: { email: normalizedEmail }
  });

  // 5. If staff does not exist, return 401.
  if (!staff) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 6. Check staff.is_active.
  // 7. If staff is inactive, return 403.
  if (!staff.is_active) {
    const error = new Error('Your account has been deactivated. Please contact an administrator.');
    error.statusCode = 403;
    throw error;
  }

  // 8. Compare the supplied password with password_hash using bcryptjs.
  // 9. If password is incorrect, return 401.
  const isPasswordMatch = await comparePassword(password, staff.password_hash);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 10-13. Get staff role, permissions, and associated screens.
  const staffDetails = await getStaffDetailsWithPermissions(staff.id);

  // 14. Generate JWT with minimal payload { staff_id, role_id }.
  const token = generateToken({
    staff_id: Number(staff.id),
    role_id: Number(staff.role_id)
  });

  // 15-18. Return user information, role information, permissions, and permitted screens.
  return {
    token,
    user: staffDetails.user,
    permissions: staffDetails.permissions,
    screens: staffDetails.screens
  };
};

module.exports = {
  login,
  getStaffDetailsWithPermissions
};
