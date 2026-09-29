const inventoryService = require('../services/inventoryService');
const { successResponse } = require('../utils/response');

/**
 * Get all inventory records
 * GET /api/inventory
 */
const getAllInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllInventory(req.query);
    return successResponse(res, 'Inventory retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single inventory record by ID
 * GET /api/inventory/:id
 */
const getInventoryById = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryById(req.params.id);
    return successResponse(res, 'Inventory record retrieved successfully', item, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update stock quantities
 * PUT /api/inventory/:id
 */
const updateStock = async (req, res, next) => {
  try {
    const item = await inventoryService.updateStock(req.params.id, req.body);
    return successResponse(res, 'Inventory updated successfully', item, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Increase stock quantity
 * POST /api/inventory/:id/increase
 */
const increaseStock = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const item = await inventoryService.increaseStock(req.params.id, amount);
    return successResponse(res, 'Stock increased successfully', item, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Decrease stock quantity
 * POST /api/inventory/:id/decrease
 */
const decreaseStock = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const item = await inventoryService.decreaseStock(req.params.id, amount);
    return successResponse(res, 'Stock decreased successfully', item, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  updateStock,
  increaseStock,
  decreaseStock
};
