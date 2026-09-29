const { Production, Product } = require('../models');
const { Op } = require('sequelize');

const ALLOWED_STATUSES = ['Planned', 'In Production', 'Completed', 'Cancelled'];

/**
 * Format a production record for consistent API output
 */
const formatProductionRecord = (record) => {
  return {
    id: record.id,
    product_id: record.product_id,
    product_name: record.product ? record.product.name : 'Unknown Product',
    product_type: record.product ? record.product.type : '',
    weekly_capacity: Number(record.weekly_capacity) || 0,
    quantity_planned: Number(record.quantity_planned) || 0,
    quantity_producing: Number(record.quantity_producing) || 0,
    quantity_completed: Number(record.quantity_completed) || 0,
    start_date: record.start_date,
    expected_completion_date: record.expected_completion_date,
    status: record.status,
    notes: record.notes,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
};

/**
 * Create a new production record
 */
const createProduction = async ({
  product_id,
  quantity_planned = 0,
  quantity_producing = 0,
  quantity_completed = 0,
  weekly_capacity = 0,
  start_date,
  expected_completion_date,
  status = 'Planned',
  notes
}) => {
  // 1. Validate product_id
  if (!product_id) {
    const error = new Error('product_id is required');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findByPk(product_id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate quantities
  const planned = parseInt(quantity_planned, 10);
  const producing = parseInt(quantity_producing, 10);
  const completed = parseInt(quantity_completed, 10);
  const capacity = parseInt(weekly_capacity, 10);

  if (isNaN(planned) || planned < 0) {
    const error = new Error('quantity_planned must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }
  if (isNaN(producing) || producing < 0) {
    const error = new Error('quantity_producing must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }
  if (isNaN(completed) || completed < 0) {
    const error = new Error('quantity_completed must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }
  if (isNaN(capacity) || capacity < 0) {
    const error = new Error('weekly_capacity must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate status
  if (status && !ALLOWED_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const production = await Production.create({
    product_id,
    quantity_planned: planned,
    quantity_producing: producing,
    quantity_completed: completed,
    weekly_capacity: capacity,
    start_date: start_date || null,
    expected_completion_date: expected_completion_date || null,
    status: status || 'Planned',
    notes: notes ? notes.trim() : null
  });

  const fullRecord = await Production.findByPk(production.id, {
    include: [{ model: Product, as: 'product' }]
  });

  return formatProductionRecord(fullRecord);
};

/**
 * Get all production records with optional filters and pagination
 */
const getAllProduction = async (query = {}) => {
  const { page = 1, limit = 50, search, status, product_id } = query;
  const where = {};
  const productWhere = {};

  if (status) {
    where.status = status;
  }

  if (product_id) {
    where.product_id = product_id;
  }

  if (search) {
    productWhere[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { type: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Production.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        as: 'product',
        where: Object.keys(productWhere).length > 0 ? productWhere : undefined
      }
    ],
    order: [['id', 'DESC']],
    limit: pageSize,
    offset
  });

  return {
    total: count,
    page: pageNumber,
    totalPages: Math.ceil(count / pageSize),
    production_records: rows.map(formatProductionRecord)
  };
};

/**
 * Get a single production record by ID
 */
const getProductionById = async (id) => {
  const record = await Production.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!record) {
    const error = new Error('Production record not found');
    error.statusCode = 404;
    throw error;
  }

  return formatProductionRecord(record);
};

/**
 * Get all production records for a specific product
 */
const getProductionByProductId = async (productId) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const records = await Production.findAll({
    where: { product_id: productId },
    include: [{ model: Product, as: 'product' }],
    order: [['id', 'DESC']]
  });

  return records.map(formatProductionRecord);
};

/**
 * Update an existing production record
 */
const updateProduction = async (id, data) => {
  const record = await Production.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!record) {
    const error = new Error('Production record not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (data.quantity_planned !== undefined) {
    const val = parseInt(data.quantity_planned, 10);
    if (isNaN(val) || val < 0) {
      const error = new Error('quantity_planned must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.quantity_planned = val;
  }

  if (data.quantity_producing !== undefined) {
    const val = parseInt(data.quantity_producing, 10);
    if (isNaN(val) || val < 0) {
      const error = new Error('quantity_producing must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.quantity_producing = val;
  }

  if (data.quantity_completed !== undefined) {
    const val = parseInt(data.quantity_completed, 10);
    if (isNaN(val) || val < 0) {
      const error = new Error('quantity_completed must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.quantity_completed = val;
  }

  if (data.weekly_capacity !== undefined) {
    const val = parseInt(data.weekly_capacity, 10);
    if (isNaN(val) || val < 0) {
      const error = new Error('weekly_capacity must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updateFields.weekly_capacity = val;
  }

  if (data.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(data.status)) {
      const error = new Error(`Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    updateFields.status = data.status;
  }

  if (data.start_date !== undefined) updateFields.start_date = data.start_date;
  if (data.expected_completion_date !== undefined) updateFields.expected_completion_date = data.expected_completion_date;
  if (data.notes !== undefined) updateFields.notes = data.notes ? data.notes.trim() : null;

  await record.update(updateFields);
  await record.reload();

  return formatProductionRecord(record);
};

/**
 * Update the status of a production record
 */
const updateProductionStatus = async (id, status) => {
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    const error = new Error(`Valid status is required. Allowed values: ${ALLOWED_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const record = await Production.findByPk(id, {
    include: [{ model: Product, as: 'product' }]
  });

  if (!record) {
    const error = new Error('Production record not found');
    error.statusCode = 404;
    throw error;
  }

  await record.update({ status });
  await record.reload();

  return formatProductionRecord(record);
};

module.exports = {
  createProduction,
  getAllProduction,
  getProductionById,
  getProductionByProductId,
  updateProduction,
  updateProductionStatus
};
