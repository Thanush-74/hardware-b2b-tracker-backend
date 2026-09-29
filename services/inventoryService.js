const { Inventory, Product } = require('../models');
const { Op } = require('sequelize');

/**
 * Determine stock status label based on available quantity
 */
const getStockStatus = (availableQuantity) => {
  if (availableQuantity <= 0) {
    return 'Out of Stock';
  }
  if (availableQuantity <= 10) {
    return 'Low Stock';
  }
  return 'In Stock';
};

/**
 * Format inventory record for consistent API responses
 */
const formatInventoryItem = (item) => {
  const totalQty = Number(item.quantity) || 0;
  const reservedQty = Number(item.reserved_quantity) || 0;
  const availableQty = Math.max(0, totalQty - reservedQty);
  const stockStatus = getStockStatus(availableQty);

  return {
    id: item.id,
    product_id: item.product_id,
    product_name: item.product ? item.product.name : 'Unknown Product',
    product_type: item.product ? item.product.type : '',
    product_specifications: item.product ? item.product.specifications : null,
    product_price: item.product ? Number(item.product.price) : 0,
    total_quantity: totalQty,
    reserved_quantity: reservedQty,
    available_quantity: availableQty,
    location: item.location || 'Main Warehouse',
    stock_status: stockStatus,
    is_active: item.product ? item.product.is_active : true,
    last_updated: item.updated_at,
    created_at: item.created_at
  };
};

/**
 * View all inventory records with optional filtering and pagination
 */
const getAllInventory = async (query = {}) => {
  const { page = 1, limit = 50, search, location, product_id } = query;
  const where = {};
  const productWhere = {};

  if (product_id) {
    where.product_id = product_id;
  }

  if (search) {
    productWhere[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { type: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (location) {
    where.location = { [Op.iLike]: `%${location}%` };
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Inventory.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        as: 'product',
        where: Object.keys(productWhere).length > 0 ? productWhere : undefined
      }
    ],
    order: [['id', 'ASC']],
    limit: pageSize,
    offset
  });

  const formattedRows = rows.map(formatInventoryItem);

  return {
    total: count,
    page: pageNumber,
    totalPages: Math.ceil(count / pageSize),
    inventory: formattedRows
  };
};

/**
 * View a single inventory record by ID
 */
const getInventoryById = async (id) => {
  const item = await Inventory.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!item) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }

  return formatInventoryItem(item);
};

/**
 * Update stock quantities and location
 */
const updateStock = async (id, { quantity, reserved_quantity, location }) => {
  const item = await Inventory.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!item) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }

  let newTotalQty = item.quantity;
  let newReservedQty = item.reserved_quantity;

  if (quantity !== undefined) {
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      const error = new Error('Quantity cannot be negative');
      error.statusCode = 400;
      throw error;
    }
    newTotalQty = parsedQty;
  }

  if (reserved_quantity !== undefined) {
    const parsedReserved = parseInt(reserved_quantity, 10);
    if (isNaN(parsedReserved) || parsedReserved < 0) {
      const error = new Error('Reserved quantity cannot be negative');
      error.statusCode = 400;
      throw error;
    }
    newReservedQty = parsedReserved;
  }

  if (newReservedQty > newTotalQty) {
    const error = new Error(
      `Reserved quantity (${newReservedQty}) cannot exceed total quantity (${newTotalQty})`
    );
    error.statusCode = 400;
    throw error;
  }

  const updateFields = {
    quantity: newTotalQty,
    reserved_quantity: newReservedQty
  };

  if (location !== undefined) {
    updateFields.location = location ? location.trim() : 'Main Warehouse';
  }

  await item.update(updateFields);

  // Sync available quantity on product
  const availableQty = newTotalQty - newReservedQty;
  if (item.product) {
    await item.product.update({ available_quantity: availableQty });
  }

  await item.reload();
  return formatInventoryItem(item);
};

/**
 * Increase stock quantity
 */
const increaseStock = async (id, amount) => {
  const numericAmount = parseInt(amount, 10);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Increase amount must be a number greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const item = await Inventory.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!item) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }

  const newTotal = item.quantity + numericAmount;
  await item.update({ quantity: newTotal });

  const availableQty = newTotal - item.reserved_quantity;
  if (item.product) {
    await item.product.update({ available_quantity: availableQty });
  }

  await item.reload();
  return formatInventoryItem(item);
};

/**
 * Decrease stock quantity
 */
const decreaseStock = async (id, amount) => {
  const numericAmount = parseInt(amount, 10);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Decrease amount must be a number greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const item = await Inventory.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!item) {
    const error = new Error('Inventory record not found');
    error.statusCode = 404;
    throw error;
  }

  const newTotal = item.quantity - numericAmount;
  if (newTotal < item.reserved_quantity) {
    const error = new Error(
      `Cannot decrease stock by ${numericAmount}. Total (${newTotal}) would fall below reserved quantity (${item.reserved_quantity})`
    );
    error.statusCode = 400;
    throw error;
  }

  await item.update({ quantity: newTotal });

  const availableQty = newTotal - item.reserved_quantity;
  if (item.product) {
    await item.product.update({ available_quantity: availableQty });
  }

  await item.reload();
  return formatInventoryItem(item);
};

module.exports = {
  getAllInventory,
  getInventoryById,
  updateStock,
  increaseStock,
  decreaseStock
};
