const productionService = require('../services/productionService');
const { successResponse } = require('../utils/response');

/**
 * Create a new production record
 * POST /api/production
 */
const createProduction = async (req, res, next) => {
  try {
    const record = await productionService.createProduction(req.body);
    return successResponse(res, 'Production record created successfully', record, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all production records
 * GET /api/production
 */
const getAllProduction = async (req, res, next) => {
  try {
    const result = await productionService.getAllProduction(req.query);
    return successResponse(res, 'Production records retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single production record by ID
 * GET /api/production/:id
 */
const getProductionById = async (req, res, next) => {
  try {
    const record = await productionService.getProductionById(req.params.id);
    return successResponse(res, 'Production record retrieved successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get production records by Product ID
 * GET /api/production/product/:productId
 */
const getProductionByProductId = async (req, res, next) => {
  try {
    const records = await productionService.getProductionByProductId(req.params.productId);
    return successResponse(res, 'Production records for product retrieved successfully', records, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update production record details
 * PUT /api/production/:id
 */
const updateProduction = async (req, res, next) => {
  try {
    const record = await productionService.updateProduction(req.params.id, req.body);
    return successResponse(res, 'Production record updated successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update production status
 * PATCH /api/production/:id/status
 */
const updateProductionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const record = await productionService.updateProductionStatus(req.params.id, status);
    return successResponse(res, 'Production status updated successfully', record, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduction,
  getAllProduction,
  getProductionById,
  getProductionByProductId,
  updateProduction,
  updateProductionStatus
};
