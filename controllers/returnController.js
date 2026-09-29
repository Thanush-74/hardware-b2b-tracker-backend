const returnService = require('../services/returnService');
const { successResponse } = require('../utils/response');

/**
 * Create a new return / replacement request
 * POST /api/returns
 */
const createReturn = async (req, res, next) => {
  try {
    const record = await returnService.createReturn(req.body);
    return successResponse(res, 'Return request created successfully', record, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all return requests
 * GET /api/returns
 */
const getAllReturns = async (req, res, next) => {
  try {
    const result = await returnService.getAllReturns(req.query);
    return successResponse(res, 'Return records retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single return record by ID or return_number
 * GET /api/returns/:id
 */
const getReturnById = async (req, res, next) => {
  try {
    const record = await returnService.getReturnById(req.params.id);
    return successResponse(res, 'Return record retrieved successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update general return details
 * PUT /api/returns/:id
 */
const updateReturn = async (req, res, next) => {
  try {
    const record = await returnService.updateReturn(req.params.id, req.body);
    return successResponse(res, 'Return record updated successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update return status
 * PATCH /api/returns/:id/status
 */
const updateReturnStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const record = await returnService.updateReturnStatus(req.params.id, status);
    return successResponse(res, 'Return status updated successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Record replacement details
 * PATCH /api/returns/:id/replacement
 */
const recordReplacement = async (req, res, next) => {
  try {
    const record = await returnService.recordReplacement(req.params.id, req.body);
    return successResponse(res, 'Replacement information updated successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReturn,
  getAllReturns,
  getReturnById,
  updateReturn,
  updateReturnStatus,
  recordReplacement
};
