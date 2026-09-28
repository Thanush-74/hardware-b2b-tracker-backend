const cartService = require('../services/cartService');
const { successResponse } = require('../utils/response');

/**
 * Get current user's active cart
 * GET /api/cart
 */
const getCart = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const cart = await cartService.getCart(staffId);
    return successResponse(res, 'Cart retrieved successfully', cart, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Add a product to the cart
 * POST /api/cart
 */
const addToCart = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const cart = await cartService.addItemToCart(staffId, req.body);
    return successResponse(res, 'Item added to cart successfully', cart, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update quantity of a cart item
 * PUT /api/cart/:id
 */
const updateCartItem = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;
    const cart = await cartService.updateCartItemQuantity(staffId, itemId, quantity);
    return successResponse(res, 'Cart item updated successfully', cart, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Remove an item from the cart
 * DELETE /api/cart/:id
 */
const removeCartItem = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const itemId = req.params.id;
    const cart = await cartService.removeCartItem(staffId, itemId);
    return successResponse(res, 'Cart item removed successfully', cart, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Clear all items in the cart
 * DELETE /api/cart
 */
const clearCart = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const cart = await cartService.clearCart(staffId);
    return successResponse(res, 'Cart cleared successfully', cart, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
