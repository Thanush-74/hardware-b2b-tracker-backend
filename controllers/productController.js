const productService = require('../services/productService');
const { successResponse } = require('../utils/response');

/**
 * Create a new product
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return successResponse(res, 'Product created successfully', product, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all products
 * GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    return successResponse(res, 'Products retrieved successfully', result, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return successResponse(res, 'Product retrieved successfully', product, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update product by ID
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return successResponse(res, 'Product updated successfully', product, 200);
  } catch (error) {
    return next(error);
  }
};

/**
 * Deactivate / Soft delete product by ID
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deactivateProduct(req.params.id);
    return successResponse(res, 'Product deactivated successfully', product, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
