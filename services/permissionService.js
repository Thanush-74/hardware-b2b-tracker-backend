const { Permission, Screen, Role, Staff, RolePermission, StaffPermission, sequelize } = require('../models');

/**
 * Get all permissions grouped by or with screen details
 */
const getAllPermissions = async () => {
  return await Permission.findAll({
    include: [
      {
        model: Screen,
        as: 'screen',
        attributes: ['id', 'name', 'slug', 'route']
      }
    ],
    order: [['screen_id', 'ASC'], ['id', 'ASC']]
  });
};

/**
 * Get permissions for a specific role
 */
const getRolePermissions = async (roleId) => {
  const role = await Role.findByPk(roleId, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        include: [{ model: Screen, as: 'screen' }],
        through: { attributes: [] }
      }
    ]
  });

  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  return role.permissions;
};

/**
 * Update/assign permissions to a role (Admin only)
 */
const updateRolePermissions = async (roleId, permissionIds, transaction) => {
  if (!Array.isArray(permissionIds)) {
    const error = new Error('permission_ids must be an array of permission IDs');
    error.statusCode = 400;
    throw error;
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate that all permission IDs exist
  if (permissionIds.length > 0) {
    const existingPermissions = await Permission.findAll({
      where: { id: permissionIds }
    });

    if (existingPermissions.length !== permissionIds.length) {
      const error = new Error('One or more permission IDs are invalid');
      error.statusCode = 400;
      throw error;
    }
  }

  // Remove existing role permissions
  await RolePermission.destroy({
    where: { role_id: roleId },
    ...(transaction && { transaction })
  });

  // Add new role permissions
  if (permissionIds.length > 0) {
    const rolePermRecords = permissionIds.map(permId => ({
      role_id: roleId,
      permission_id: permId
    }));
    await RolePermission.bulkCreate(rolePermRecords, {
      ...(transaction && { transaction })
    });
  }

  return await getRolePermissions(roleId);
};

/**
 * Get staff-specific direct permissions
 */
const getStaffPermissions = async (staffId) => {
  const staff = await Staff.findByPk(staffId, {
    include: [
      {
        model: Permission,
        as: 'direct_permissions',
        include: [{ model: Screen, as: 'screen' }],
        through: { attributes: [] }
      },
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: Permission,
            as: 'permissions',
            include: [{ model: Screen, as: 'screen' }],
            through: { attributes: [] }
          }
        ]
      }
    ]
  });

  if (!staff) {
    const error = new Error('Staff member not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    staff_id: staff.id,
    direct_permissions: staff.direct_permissions,
    role_permissions: staff.role ? staff.role.permissions : []
  };
};

/**
 * Update/assign staff-specific direct permissions (Admin only)
 */
const updateStaffPermissions = async (staffId, permissionIds, transaction) => {
  if (!Array.isArray(permissionIds)) {
    const error = new Error('permission_ids must be an array of permission IDs');
    error.statusCode = 400;
    throw error;
  }

  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    const error = new Error('Staff member not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate that all permission IDs exist
  if (permissionIds.length > 0) {
    const existingPermissions = await Permission.findAll({
      where: { id: permissionIds }
    });

    if (existingPermissions.length !== permissionIds.length) {
      const error = new Error('One or more permission IDs are invalid');
      error.statusCode = 400;
      throw error;
    }
  }

  if (StaffPermission) {
    // Remove existing direct staff permissions
    await StaffPermission.destroy({
      where: { staff_id: staffId },
      ...(transaction && { transaction })
    });

    // Add new direct staff permissions
    if (permissionIds.length > 0) {
      const staffPermRecords = permissionIds.map(permId => ({
        staff_id: staffId,
        permission_id: permId
      }));
      await StaffPermission.bulkCreate(staffPermRecords, {
        ...(transaction && { transaction })
      });
    }
  }

  return await getStaffPermissions(staffId);
};

module.exports = {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
  getStaffPermissions,
  updateStaffPermissions
};
