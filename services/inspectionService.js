const { Op } = require('sequelize');
const { Inspection, Staff, Product, Return, Production, Role } = require('../models');
const notificationService = require('./notificationService');

/**
 * Inspection Service
 * Handles QA inspections for production runs, inventory batches, and returned items.
 */

// 1. Create Inspection
async function createInspection(inspectionData) {
  const {
    inspector_id,
    product_id,
    return_id,
    production_id,
    inspection_date,
    item_type = 'Finished Good',
    batch_number,
    quantity_inspected = 1,
    passed_quantity = 0,
    failed_quantity = 0,
    result = 'Pending',
    defect_type,
    severity = 'Low',
    notes
  } = inspectionData;

  if (!inspector_id) {
    const error = new Error('Inspector ID is required');
    error.statusCode = 400;
    throw error;
  }

  // Validate Inspector Staff
  const inspector = await Staff.findByPk(inspector_id);
  if (!inspector) {
    const error = new Error('Inspector staff member not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate Product if provided
  if (product_id) {
    const product = await Product.findByPk(product_id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate Return if provided
  if (return_id) {
    const returnRecord = await Return.findByPk(return_id);
    if (!returnRecord) {
      const error = new Error('Return record not found');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate Production if provided
  if (production_id) {
    const prod = await Production.findByPk(production_id);
    if (!prod) {
      const error = new Error('Production batch not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const qInspected = quantity_inspected !== undefined ? parseInt(quantity_inspected, 10) : 1;
  const qPassed = passed_quantity !== undefined ? parseInt(passed_quantity, 10) : 0;
  const qFailed = failed_quantity !== undefined ? parseInt(failed_quantity, 10) : 0;

  if (isNaN(qInspected) || qInspected < 1) {
    const error = new Error('Quantity inspected must be at least 1');
    error.statusCode = 400;
    throw error;
  }

  const inspection = await Inspection.create({
    inspector_id,
    product_id: product_id || null,
    return_id: return_id || null,
    production_id: production_id || null,
    inspection_date: inspection_date || new Date().toISOString().split('T')[0],
    item_type,
    batch_number: batch_number || null,
    quantity_inspected: qInspected,
    passed_quantity: qPassed,
    failed_quantity: qFailed,
    result,
    defect_type: defect_type || null,
    severity: severity || 'Low',
    notes: notes || null
  });

  try {
    if (inspector_id) {
      await notificationService.createNotification({
        recipient_staff_id: inspector_id,
        title: 'Inspection Logged',
        message: `Quality inspection for ${item_type} recorded with result: ${result}.`,
        type: 'inspection_result'
      });
    }
    if (result === 'Failed' || severity === 'High' || severity === 'Critical') {
      await notificationService.notifyAdmins({
        title: 'QA Inspection Alert',
        message: `Quality inspection recorded ${result} (${defect_type || 'Defect detected'}).`,
        type: 'inspection_result'
      });
    }
  } catch (notifyErr) {
    console.error('Inspection notification warning:', notifyErr.message);
  }

  return getInspectionById(inspection.id);
}

// 2. Get all inspections with filters & pagination
async function getAllInspections(query = {}) {
  const {
    page = 1,
    limit = 10,
    result,
    defect_type,
    severity,
    item_type,
    inspector_id,
    product_id,
    return_id,
    production_id,
    start_date,
    end_date,
    search
  } = query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  if (result) {
    whereClause.result = { [Op.iLike]: result };
  }

  if (defect_type) {
    whereClause.defect_type = { [Op.iLike]: `%${defect_type}%` };
  }

  if (severity) {
    whereClause.severity = { [Op.iLike]: severity };
  }

  if (item_type) {
    whereClause.item_type = { [Op.iLike]: item_type };
  }

  if (inspector_id) {
    whereClause.inspector_id = inspector_id;
  }

  if (product_id) {
    whereClause.product_id = product_id;
  }

  if (return_id) {
    whereClause.return_id = return_id;
  }

  if (production_id) {
    whereClause.production_id = production_id;
  }

  if (start_date && end_date) {
    whereClause.inspection_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    whereClause.inspection_date = { [Op.gte]: start_date };
  } else if (end_date) {
    whereClause.inspection_date = { [Op.lte]: end_date };
  }

  if (search) {
    whereClause[Op.or] = [
      { batch_number: { [Op.iLike]: `%${search}%` } },
      { defect_type: { [Op.iLike]: `%${search}%` } },
      { notes: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Inspection.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Staff,
        as: 'inspector',
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_active', 'role_id'],
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'slug']
          }
        ]
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'type', 'price', 'available_quantity']
      },
      {
        model: Return,
        as: 'return_record',
        attributes: ['id', 'return_number', 'return_reason', 'status']
      },
      {
        model: Production,
        as: 'production',
        attributes: ['id', 'quantity_planned', 'quantity_producing', 'quantity_completed', 'status']
      }
    ],
    order: [['inspection_date', 'DESC'], ['created_at', 'DESC']],
    limit: limitNum,
    offset
  });

  return {
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
    inspections: rows
  };
}

// 3. Get single inspection by ID
async function getInspectionById(id) {
  const inspection = await Inspection.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'inspector',
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_active', 'role_id'],
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'slug']
          }
        ]
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'type', 'price', 'available_quantity']
      },
      {
        model: Return,
        as: 'return_record',
        attributes: ['id', 'return_number', 'return_reason', 'status']
      },
      {
        model: Production,
        as: 'production',
        attributes: ['id', 'quantity_planned', 'quantity_producing', 'quantity_completed', 'status']
      }
    ]
  });

  if (!inspection) {
    const error = new Error('Inspection report not found');
    error.statusCode = 404;
    throw error;
  }

  return inspection;
}

// 4. Update inspection
async function updateInspection(id, updateData) {
  const inspection = await Inspection.findByPk(id);

  if (!inspection) {
    const error = new Error('Inspection report not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    inspector_id,
    product_id,
    return_id,
    production_id,
    inspection_date,
    item_type,
    batch_number,
    quantity_inspected,
    passed_quantity,
    failed_quantity,
    result,
    defect_type,
    severity,
    notes
  } = updateData;

  if (inspector_id) {
    const inspector = await Staff.findByPk(inspector_id);
    if (!inspector) {
      const error = new Error('Inspector staff member not found');
      error.statusCode = 404;
      throw error;
    }
    inspection.inspector_id = inspector_id;
  }

  if (product_id !== undefined) inspection.product_id = product_id || null;
  if (return_id !== undefined) inspection.return_id = return_id || null;
  if (production_id !== undefined) inspection.production_id = production_id || null;
  if (inspection_date !== undefined) inspection.inspection_date = inspection_date;
  if (item_type !== undefined) inspection.item_type = item_type;
  if (batch_number !== undefined) inspection.batch_number = batch_number;
  if (quantity_inspected !== undefined) inspection.quantity_inspected = parseInt(quantity_inspected, 10);
  if (passed_quantity !== undefined) inspection.passed_quantity = parseInt(passed_quantity, 10);
  if (failed_quantity !== undefined) inspection.failed_quantity = parseInt(failed_quantity, 10);
  if (result !== undefined) inspection.result = result;
  if (defect_type !== undefined) inspection.defect_type = defect_type;
  if (severity !== undefined) inspection.severity = severity;
  if (notes !== undefined) inspection.notes = notes;

  await inspection.save();

  return getInspectionById(id);
}

// 5. Delete inspection
async function deleteInspection(id) {
  const inspection = await Inspection.findByPk(id);

  if (!inspection) {
    const error = new Error('Inspection report not found');
    error.statusCode = 404;
    throw error;
  }

  await inspection.destroy();
  return { message: 'Inspection report deleted successfully' };
}

// 6. Get Quality & Inspection Summary
async function getInspectionSummary(query = {}) {
  const { start_date, end_date } = query;
  const whereClause = {};

  if (start_date && end_date) {
    whereClause.inspection_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    whereClause.inspection_date = { [Op.gte]: start_date };
  } else if (end_date) {
    whereClause.inspection_date = { [Op.lte]: end_date };
  }

  const allInspections = await Inspection.findAll({
    where: whereClause,
    attributes: ['quantity_inspected', 'passed_quantity', 'failed_quantity', 'result', 'defect_type', 'severity']
  });

  let totalInspected = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const byResult = {};
  const byDefect = {};
  const bySeverity = {};

  allInspections.forEach(item => {
    totalInspected += item.quantity_inspected || 0;
    totalPassed += item.passed_quantity || 0;
    totalFailed += item.failed_quantity || 0;

    // Result breakdown
    byResult[item.result] = (byResult[item.result] || 0) + 1;

    // Defect breakdown
    if (item.defect_type) {
      byDefect[item.defect_type] = (byDefect[item.defect_type] || 0) + 1;
    }

    // Severity breakdown
    if (item.severity) {
      bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
    }
  });

  const passRate = totalInspected > 0 ? parseFloat(((totalPassed / totalInspected) * 100).toFixed(2)) : 100.00;

  return {
    totalReports: allInspections.length,
    totalInspected,
    totalPassed,
    totalFailed,
    passRatePercentage: passRate,
    byResult,
    byDefect,
    bySeverity
  };
}

module.exports = {
  createInspection,
  getAllInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionSummary
};
