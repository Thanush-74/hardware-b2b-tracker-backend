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

module.exports = {
  getAllRoles,
  getRoleById
};
