const permissionService = require('../services/permissionService');
const { sequelize } = require('../models');
const { successResponse } = require('../utils/response');

/**
 * Get all available permissions
 * GET /api/permissions
 */
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    return successResponse(res, 'Permissions retrieved successfully', permissions, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get permissions for a specific role
 * GET /api/roles/:roleId/permissions
 */
const getRolePermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.getRolePermissions(req.params.roleId);
    return successResponse(res, 'Role permissions retrieved successfully', permissions, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update permissions for a role (Admin only)
 * PUT /api/roles/:roleId/permissions
 */
const updateRolePermissions = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { permission_ids } = req.body;
    const permissions = await permissionService.updateRolePermissions(req.params.roleId, permission_ids, transaction);
    await transaction.commit();
    return successResponse(res, 'Role permissions updated successfully', permissions, 200);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

/**
 * Get direct/custom permissions for a staff member
 * GET /api/staff/:staffId/permissions
 */
const getStaffPermissions = async (req, res, next) => {
  try {
    const data = await permissionService.getStaffPermissions(req.params.staffId);
    return successResponse(res, 'Staff permissions retrieved successfully', data, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update direct/custom permissions for a staff member (Admin only)
 * PUT /api/staff/:staffId/permissions
 */
const updateStaffPermissions = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { permission_ids } = req.body;
    const permissions = await permissionService.updateStaffPermissions(req.params.staffId, permission_ids, transaction);
    await transaction.commit();
    return successResponse(res, 'Staff specific permissions updated successfully', permissions, 200);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

module.exports = {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
  getStaffPermissions,
  updateStaffPermissions
};
