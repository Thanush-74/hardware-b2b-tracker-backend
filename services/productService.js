const { Product, Inventory } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new product
 */
const createProduct = async ({ name, type, specifications, price, available_quantity = 0, description, is_active = true }) => {
  // 1. Validate required fields
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Product name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!type || typeof type !== 'string' || !type.trim()) {
    const error = new Error('Product type is required (e.g. SSD, RAM)');
    error.statusCode = 400;
    throw error;
  }

  if (price === undefined || price === null || isNaN(Number(price))) {
    const error = new Error('Valid product price is required');
    error.statusCode = 400;
    throw error;
  }

  const numericPrice = Number(price);
  if (numericPrice < 0) {
    const error = new Error('Price cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  const numericQuantity = Number(available_quantity);
  if (isNaN(numericQuantity) || numericQuantity < 0) {
    const error = new Error('Available quantity must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }

  // 2. Create product in database
  const product = await Product.create({
    name: name.trim(),
    type: type.trim(),
    specifications: specifications || null,
    price: numericPrice,
    available_quantity: numericQuantity,
    description: description ? description.trim() : null,
    is_active: is_active !== undefined ? Boolean(is_active) : true
  });

  // 3. Create corresponding inventory record
  await Inventory.create({
    product_id: product.id,
    quantity: numericQuantity,
    reserved_quantity: 0,
    location: 'Main Warehouse'
  });

  return product;
};

/**
 * Get all products with optional filters and pagination
 */
const getAllProducts = async (query = {}) => {
  const { page = 1, limit = 50, search, type, is_active } = query;
  const where = {};

  // Search by name or type
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { type: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Filter by type
  if (type) {
    where.type = { [Op.iLike]: `%${type}%` };
  }

  // Filter by active status
  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true' || is_active === true;
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Product.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    limit: pageSize,
    offset
  });

  return {
    total: count,
    page: pageNumber,
    totalPages: Math.ceil(count / pageSize),
    products: rows
  };
};

/**
 * Get a single product by ID
 */
const getProductById = async (id) => {
  const product = await Product.findByPk(id);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Update an existing product
 */
const updateProduct = async (id, data) => {
  const product = await Product.findByPk(id);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      const error = new Error('Product name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updateFields.name = data.name.trim();
  }

  if (data.type !== undefined) {
    if (!data.type || !data.type.trim()) {
      const error = new Error('Product type cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updateFields.type = data.type.trim();
  }

  if (data.specifications !== undefined) {
    updateFields.specifications = data.specifications;
  }

  if (data.price !== undefined) {
    const numericPrice = Number(data.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      const error = new Error('Price must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.price = numericPrice;
  }

  if (data.available_quantity !== undefined) {
    const numericQty = Number(data.available_quantity);
    if (isNaN(numericQty) || numericQty < 0) {
      const error = new Error('Available quantity must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.available_quantity = numericQty;
  }

  if (data.description !== undefined) {
    updateFields.description = data.description ? data.description.trim() : null;
  }

  if (data.is_active !== undefined) {
    updateFields.is_active = Boolean(data.is_active);
  }

  await product.update(updateFields);

  return product;
};

/**
 * Soft delete / deactivate a product
 */
const deactivateProduct = async (id) => {
  const product = await Product.findByPk(id);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  await product.update({ is_active: false });

  return product;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deactivateProduct
};
