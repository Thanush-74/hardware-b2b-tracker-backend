const roleService = require('../services/roleService');
const { successResponse } = require('../utils/response');

/**
 * Get all roles
 * GET /api/roles
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    return successResponse(res, 'Roles retrieved successfully', roles, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get role by ID
 * GET /api/roles/:id
 */
const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return successResponse(res, 'Role retrieved successfully', role, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new role with permissions/screens (Admin only)
 * POST /api/roles
 */
const createRole = async (req, res, next) => {
  try {
    const { name, slug, description, screens, screen_ids, permissions, permission_ids } = req.body;
    const role = await roleService.createRole({
      name,
      slug,
      description,
      screens,
      screen_ids,
      permissions,
      permission_ids
    });
    return successResponse(res, 'Role created successfully', role, 201);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole
};
