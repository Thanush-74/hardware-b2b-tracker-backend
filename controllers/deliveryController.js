const deliveryService = require('../services/deliveryService');
const { successResponse } = require('../utils/response');

/**
 * Create a new delivery record
 * POST /api/deliveries
 */
const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    return successResponse(res, 'Delivery record created successfully', delivery, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all deliveries
 * GET /api/deliveries
 */
const getAllDeliveries = async (req, res, next) => {
  try {
    const result = await deliveryService.getAllDeliveries(req.query);
    return successResponse(res, 'Deliveries retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single delivery by ID or tracking_number
 * GET /api/deliveries/:id
 */
const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    return successResponse(res, 'Delivery retrieved successfully', delivery, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update delivery details
 * PUT /api/deliveries/:id
 */
const updateDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateDelivery(req.params.id, req.body);
    return successResponse(res, 'Delivery updated successfully', delivery, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update delivery status
 * PATCH /api/deliveries/:id/status
 */
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const delivery = await deliveryService.updateDeliveryStatus(req.params.id, status);
    return successResponse(res, 'Delivery status updated successfully', delivery, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Assign delivery staff
 * PATCH /api/deliveries/:id/assign
 */
const assignDeliveryStaff = async (req, res, next) => {
  try {
    const { delivery_staff_id } = req.body;
    const delivery = await deliveryService.assignDeliveryStaff(req.params.id, delivery_staff_id);
    return successResponse(res, 'Delivery staff assigned successfully', delivery, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  updateDeliveryStatus,
  assignDeliveryStaff
};
