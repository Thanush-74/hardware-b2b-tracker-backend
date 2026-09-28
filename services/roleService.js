const { Role, Permission } = require('../models');

/**
 * Get all roles with their assigned permissions
 */
const getAllRoles = async () => {
  return await Role.findAll({
    include: [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'name', 'slug', 'screen_id'],
        through: { attributes: [] }
      }
    ],
    order: [['id', 'ASC']]
  });
};

/**
 * Get role by ID with permissions
 */
const getRoleById = async (id) => {
  const role = await Role.findByPk(id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'name', 'slug', 'screen_id'],
        through: { attributes: [] }
      }
    ]
  });

  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  return role;
};

module.exports = {
  getAllRoles,
  getRoleById
};
