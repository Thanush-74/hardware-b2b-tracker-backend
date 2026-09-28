const staffService = require('../services/staffService');
const { successResponse } = require('../utils/response');

/**
 * Create a new staff member (Admin only)
 * POST /api/staff
 */
const createStaff = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role_id } = req.body;
    const staff = await staffService.createStaff({
      first_name,
      last_name,
      email,
      password,
      role_id
    });
    return successResponse(res, 'Staff member created successfully', staff, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all staff members with pagination & filtering
 * GET /api/staff
 */
const getAllStaff = async (req, res, next) => {
  try {
    const result = await staffService.getAllStaff(req.query);
    return successResponse(res, 'Staff members retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single staff member by ID
 * GET /api/staff/:id
 */
const getStaffById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    return successResponse(res, 'Staff member retrieved successfully', staff, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update a staff member
 * PUT /api/staff/:id
 */
const updateStaff = async (req, res, next) => {
  try {
    const { first_name, last_name, email, role_id, password } = req.body;
    const updatedStaff = await staffService.updateStaff(req.params.id, {
      first_name,
      last_name,
      email,
      role_id,
      password
    });
    return successResponse(res, 'Staff member updated successfully', updatedStaff, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update staff active status
 * PATCH /api/staff/:id/status
 */
const updateStaffStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const updatedStaff = await staffService.updateStaffStatus(req.params.id, is_active);
    return successResponse(res, `Staff member status updated to ${is_active ? 'active' : 'inactive'}`, updatedStaff, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus
};
