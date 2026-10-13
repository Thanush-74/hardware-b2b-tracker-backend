const { Op } = require('sequelize');
const { ManufacturingAssignment, Staff, Product, Role, Production } = require('../models');

/**
 * Manufacturing Area Service
 * Handles staff sector assignments, shifts, manufacturing lines, and production batch tracking.
 */

// 1. Create assignment
async function createAssignment(assignmentData) {
  const {
    staff_id,
    sector,
    product_id,
    production_id,
    completed_quantity = 0,
    start_date,
    end_date,
    status,
    shift,
    notes
  } = assignmentData;

  if (!staff_id) {
    const error = new Error('Staff ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!sector || !sector.trim()) {
    const error = new Error('Sector is required');
    error.statusCode = 400;
    throw error;
  }

  // Validate staff exists
  const staff = await Staff.findByPk(staff_id);
  if (!staff) {
    const error = new Error('Staff member not found');
    error.statusCode = 404;
    throw error;
  }

  let resolvedProductId = product_id || null;
  let productionRecord = null;

  // Validate production batch if provided
  if (production_id) {
    productionRecord = await Production.findByPk(production_id);
    if (!productionRecord) {
      const error = new Error('Production batch not found');
      error.statusCode = 404;
      throw error;
    }
    // Automatically link to production batch product
    if (!resolvedProductId) {
      resolvedProductId = productionRecord.product_id;
    }
  }

  // Validate product if provided
  if (resolvedProductId) {
    const product = await Product.findByPk(resolvedProductId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const numCompleted = Number(completed_quantity) || 0;
  if (numCompleted < 0) {
    const error = new Error('Completed quantity cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  if (productionRecord && numCompleted > 0) {
    const existingCompleted = (await ManufacturingAssignment.sum('completed_quantity', {
      where: { production_id }
    })) || 0;

    const totalBatchCompleted = existingCompleted + numCompleted;
    if (totalBatchCompleted > productionRecord.quantity_planned) {
      const error = new Error(
        `Completed quantity (${totalBatchCompleted}) exceeds production batch target (${productionRecord.quantity_planned})`
      );
      error.statusCode = 400;
      throw error;
    }

    // Update production progress
    productionRecord.quantity_completed = totalBatchCompleted;
    if (productionRecord.quantity_completed >= productionRecord.quantity_planned) {
      productionRecord.status = 'Completed';
    } else if (productionRecord.status === 'Planned') {
      productionRecord.status = 'In Production';
    }
    await productionRecord.save();
  }

  const assignment = await ManufacturingAssignment.create({
    staff_id,
    sector: sector.trim(),
    product_id: resolvedProductId,
    production_id: production_id || null,
    completed_quantity: numCompleted,
    start_date: start_date || new Date().toISOString().split('T')[0],
    end_date: end_date || null,
    status: status || 'Working',
    shift: shift || 'Day',
    notes: notes || null
  });

  return getAssignmentById(assignment.id);
}

// 2. Get all assignments with filters & pagination
async function getAllAssignments(query = {}) {
  const {
    page = 1,
    limit = 10,
    staff_id,
    sector,
    status,
    shift,
    product_id,
    production_id,
    search
  } = query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  if (staff_id) whereClause.staff_id = staff_id;
  if (sector) whereClause.sector = sector;
  if (status) whereClause.status = status;
  if (shift) whereClause.shift = shift;
  if (product_id) whereClause.product_id = product_id;
  if (production_id) whereClause.production_id = production_id;

  if (search) {
    whereClause[Op.or] = [
      { sector: { [Op.iLike]: `%${search}%` } },
      { shift: { [Op.iLike]: `%${search}%` } },
      { notes: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await ManufacturingAssignment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Staff,
        as: 'staff',
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
        model: Production,
        as: 'production',
        attributes: ['id', 'quantity_planned', 'quantity_producing', 'quantity_completed', 'status']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: limitNum,
    offset
  });

  return {
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
    assignments: rows
  };
}

// 3. Get single assignment by ID
async function getAssignmentById(id) {
  const assignment = await ManufacturingAssignment.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
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
        model: Production,
        as: 'production',
        attributes: ['id', 'quantity_planned', 'quantity_producing', 'quantity_completed', 'status']
      }
    ]
  });

  if (!assignment) {
    const error = new Error('Manufacturing assignment not found');
    error.statusCode = 404;
    throw error;
  }

  return assignment;
}

// 4. Update assignment
async function updateAssignment(id, updateData) {
  const assignment = await ManufacturingAssignment.findByPk(id);

  if (!assignment) {
    const error = new Error('Manufacturing assignment not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    staff_id,
    sector,
    product_id,
    production_id,
    completed_quantity,
    start_date,
    end_date,
    status,
    shift,
    notes
  } = updateData;

  if (staff_id) {
    const staff = await Staff.findByPk(staff_id);
    if (!staff) {
      const error = new Error('Staff member not found');
      error.statusCode = 404;
      throw error;
    }
    assignment.staff_id = staff_id;
  }

  if (product_id !== undefined) {
    if (product_id) {
      const product = await Product.findByPk(product_id);
      if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
      }
      assignment.product_id = product_id;
    } else {
      assignment.product_id = null;
    }
  }

  const targetProdId = production_id !== undefined ? production_id : assignment.production_id;
  if (targetProdId) {
    const prod = await Production.findByPk(targetProdId);
    if (!prod) {
      const error = new Error('Production batch not found');
      error.statusCode = 404;
      throw error;
    }
    if (production_id !== undefined) {
      assignment.production_id = production_id || null;
      if (!assignment.product_id) {
        assignment.product_id = prod.product_id;
      }
    }

    if (completed_quantity !== undefined) {
      const numCompleted = Number(completed_quantity) || 0;
      if (numCompleted < 0) {
        const error = new Error('Completed quantity cannot be negative');
        error.statusCode = 400;
        throw error;
      }

      // Calculate total across all assignments for this production batch excluding old value of this assignment
      const otherCompleted = (await ManufacturingAssignment.sum('completed_quantity', {
        where: {
          production_id: targetProdId,
          id: { [Op.ne]: assignment.id }
        }
      })) || 0;

      const totalBatchCompleted = otherCompleted + numCompleted;
      if (totalBatchCompleted > prod.quantity_planned) {
        const error = new Error(
          `Completed quantity (${totalBatchCompleted}) exceeds production batch target (${prod.quantity_planned})`
        );
        error.statusCode = 400;
        throw error;
      }

      assignment.completed_quantity = numCompleted;
      prod.quantity_completed = totalBatchCompleted;
      if (prod.quantity_completed >= prod.quantity_planned) {
        prod.status = 'Completed';
      } else if (prod.status === 'Planned' && totalBatchCompleted > 0) {
        prod.status = 'In Production';
      }
      await prod.save();
    }
  } else if (completed_quantity !== undefined) {
    const numCompleted = Number(completed_quantity) || 0;
    if (numCompleted < 0) {
      const error = new Error('Completed quantity cannot be negative');
      error.statusCode = 400;
      throw error;
    }
    assignment.completed_quantity = numCompleted;
  }

  if (sector !== undefined) assignment.sector = sector.trim();
  if (start_date !== undefined) assignment.start_date = start_date;
  if (end_date !== undefined) assignment.end_date = end_date;
  if (status !== undefined) assignment.status = status;
  if (shift !== undefined) assignment.shift = shift;
  if (notes !== undefined) assignment.notes = notes;

  await assignment.save();

  return getAssignmentById(id);
}

// 5. Delete assignment
async function deleteAssignment(id) {
  const assignment = await ManufacturingAssignment.findByPk(id);

  if (!assignment) {
    const error = new Error('Manufacturing assignment not found');
    error.statusCode = 404;
    throw error;
  }

  await assignment.destroy();
  return { message: 'Manufacturing assignment deleted successfully' };
}

// 6. Get sector summary metrics
async function getSectorSummary() {
  const assignments = await ManufacturingAssignment.findAll({
    attributes: ['sector', 'status', 'shift']
  });

  const sectorCounts = {};
  const statusCounts = {};

  assignments.forEach(a => {
    sectorCounts[a.sector] = (sectorCounts[a.sector] || 0) + 1;
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  return {
    totalAssignments: assignments.length,
    bySector: sectorCounts,
    byStatus: statusCounts
  };
}

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getSectorSummary
};
