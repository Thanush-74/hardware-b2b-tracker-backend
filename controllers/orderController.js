const orderService = require('../services/orderService');
const { successResponse } = require('../utils/response');

/**
 * Create a new customer order
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const order = await orderService.createOrder(staffId, req.body);
    return successResponse(res, 'Order created successfully', order, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all customer orders
 * GET /api/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    return successResponse(res, 'Orders retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single order by ID or order_number
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return successResponse(res, 'Order retrieved successfully', order, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update general order details
 * PUT /api/orders/:id
 */
const updateOrder = async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(req.params.id, req.body);
    return successResponse(res, 'Order updated successfully', order, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update order status
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { order_status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, order_status);
    return successResponse(res, 'Order status updated successfully', order, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update payment status and payment details
 * PATCH /api/orders/:id/payment
 */
const updatePaymentStatus = async (req, res, next) => {
  try {
    const order = await orderService.updatePaymentStatus(req.params.id, req.body);
    return successResponse(res, 'Payment status updated successfully', order, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  updatePaymentStatus
};
