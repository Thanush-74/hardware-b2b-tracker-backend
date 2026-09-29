const { Return, Order, Product } = require('../models');
const { Op } = require('sequelize');

const ALLOWED_RETURN_STATUSES = [
  'Requested',
  'Approved',
  'Rejected',
  'Received',
  'Replaced',
  'Refunded',
  'Completed'
];

/**
 * Generate unique return number (e.g. RET-20260928-1934)
 */
const generateReturnNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RET-${dateStr}-${randomSuffix}`;
};

/**
 * Format return record for consistent API responses
 */
const formatReturnResponse = (record) => {
  const order = record.order;
  const product = record.product;
  const replacementProduct = record.replacement_product;

  return {
    id: record.id,
    return_number: record.return_number,
    order_id: record.order_id,
    order_number: order ? order.order_number : null,
    customer_name: record.customer_name,
    product_id: record.product_id,
    product_name: product ? product.name : 'Unknown Product',
    product_type: product ? product.type : '',
    quantity: record.quantity,
    return_reason: record.return_reason,
    return_date: record.return_date,
    status: record.status,
    replacement_required: Boolean(record.replacement_required),
    replacement_product_id: record.replacement_product_id ? Number(record.replacement_product_id) : null,
    replacement_product_name: replacementProduct ? replacementProduct.name : null,
    replacement_quantity: Number(record.replacement_quantity) || 0,
    notes: record.notes,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
};

/**
 * Create a new return or replacement request
 */
const createReturn = async ({
  order_id,
  product_id,
  customer_name,
  quantity = 1,
  return_reason,
  replacement_required = false,
  replacement_product_id,
  replacement_quantity = 0,
  notes
}) => {
  // 1. Validate required fields
  if (!order_id) {
    const error = new Error('order_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (!product_id) {
    const error = new Error('product_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (!return_reason || !return_reason.trim()) {
    const error = new Error('return_reason is required');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findByPk(order_id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const product = await Product.findByPk(product_id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const returnQty = parseInt(quantity, 10);
  if (isNaN(returnQty) || returnQty <= 0) {
    const error = new Error('Quantity returned must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  if (replacement_product_id) {
    const replProduct = await Product.findByPk(replacement_product_id);
    if (!replProduct) {
      const error = new Error('Replacement product not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const returnNumber = generateReturnNumber();

  const returnRecord = await Return.create({
    return_number: returnNumber,
    order_id: order.id,
    product_id: product.id,
    customer_name: customer_name ? customer_name.trim() : order.customer_name,
    quantity: returnQty,
    return_reason: return_reason.trim(),
    return_date: new Date(),
    status: 'Requested',
    replacement_required: Boolean(replacement_required),
    replacement_product_id: replacement_product_id || null,
    replacement_quantity: parseInt(replacement_quantity, 10) || 0,
    notes: notes ? notes.trim() : null
  });

  return await getReturnById(returnRecord.id);
};

/**
 * Get all returns with optional filtering and pagination
 */
const getAllReturns = async (query = {}) => {
  const { page = 1, limit = 50, search, status, order_id, product_id, replacement_required } = query;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (order_id) {
    where.order_id = order_id;
  }

  if (product_id) {
    where.product_id = product_id;
  }

  if (replacement_required !== undefined && replacement_required !== '') {
    where.replacement_required = replacement_required === 'true' || replacement_required === true;
  }

  if (search) {
    where[Op.or] = [
      { return_number: { [Op.iLike]: `%${search}%` } },
      { customer_name: { [Op.iLike]: `%${search}%` } },
      { return_reason: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Return.findAndCountAll({
    where,
    include: [
      { model: Order, as: 'order' },
      { model: Product, as: 'product' },
      { model: Product, as: 'replacement_product' }
    ],
    order: [['id', 'DESC']],
    limit: pageSize,
    offset
  });

  return {
    total: count,
    page: pageNumber,
    totalPages: Math.ceil(count / pageSize),
    returns: rows.map(formatReturnResponse)
  };
};

/**
 * Get single return record by ID or return_number
 */
const getReturnById = async (idOrNumber) => {
  const isNumeric = /^\d+$/.test(idOrNumber.toString());
  const where = isNumeric ? { id: idOrNumber } : { return_number: idOrNumber };

  const record = await Return.findOne({
    where,
    include: [
      { model: Order, as: 'order' },
      { model: Product, as: 'product' },
      { model: Product, as: 'replacement_product' }
    ]
  });

  if (!record) {
    const error = new Error('Return record not found');
    error.statusCode = 404;
    throw error;
  }

  return formatReturnResponse(record);
};

/**
 * Update general return details
 */
const updateReturn = async (id, data) => {
  const record = await Return.findByPk(id);

  if (!record) {
    const error = new Error('Return record not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (data.customer_name !== undefined) {
    if (!data.customer_name.trim()) {
      const error = new Error('customer_name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updateFields.customer_name = data.customer_name.trim();
  }

  if (data.return_reason !== undefined) {
    if (!data.return_reason.trim()) {
      const error = new Error('return_reason cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updateFields.return_reason = data.return_reason.trim();
  }

  if (data.quantity !== undefined) {
    const qty = parseInt(data.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      const error = new Error('Quantity must be greater than 0');
      error.statusCode = 400;
      throw error;
    }
    updateFields.quantity = qty;
  }

  if (data.notes !== undefined) {
    updateFields.notes = data.notes ? data.notes.trim() : null;
  }

  await record.update(updateFields);

  return await getReturnById(record.id);
};

/**
 * Update return status
 */
const updateReturnStatus = async (id, status) => {
  if (!status || !ALLOWED_RETURN_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Allowed values: ${ALLOWED_RETURN_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const record = await Return.findByPk(id);

  if (!record) {
    const error = new Error('Return record not found');
    error.statusCode = 404;
    throw error;
  }

  await record.update({ status });

  return await getReturnById(record.id);
};

/**
 * Record replacement details
 */
const recordReplacement = async (id, { replacement_required, replacement_product_id, replacement_quantity }) => {
  const record = await Return.findByPk(id);

  if (!record) {
    const error = new Error('Return record not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (replacement_required !== undefined) {
    updateFields.replacement_required = Boolean(replacement_required);
  }

  if (replacement_product_id !== undefined) {
    if (replacement_product_id) {
      const replProduct = await Product.findByPk(replacement_product_id);
      if (!replProduct) {
        const error = new Error('Replacement product not found');
        error.statusCode = 404;
        throw error;
      }
      updateFields.replacement_product_id = replacement_product_id;
    } else {
      updateFields.replacement_product_id = null;
    }
  }

  if (replacement_quantity !== undefined) {
    const replQty = parseInt(replacement_quantity, 10);
    if (isNaN(replQty) || replQty < 0) {
      const error = new Error('Replacement quantity must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.replacement_quantity = replQty;
  }

  await record.update(updateFields);

  return await getReturnById(record.id);
};

module.exports = {
  createReturn,
  getAllReturns,
  getReturnById,
  updateReturn,
  updateReturnStatus,
  recordReplacement
};
