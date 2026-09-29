const { Op } = require('sequelize');
const { ManufacturingAssignment, Staff, Product, Role } = require('../models');

/**
 * Manufacturing Area Service
 * Handles staff sector assignments, shifts, and manufacturing lines.
 */

// 1. Create assignment
async function createAssignment(assignmentData) {
  const { staff_id, sector, product_id, start_date, end_date, status, shift, notes } = assignmentData;

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

  // Validate product if provided
  if (product_id) {
    const product = await Product.findByPk(product_id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const assignment = await ManufacturingAssignment.create({
    staff_id,
    sector: sector.trim(),
    product_id: product_id || null,
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
    search
  } = query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  if (staff_id) {
    whereClause.staff_id = staff_id;
  }

  if (sector) {
    whereClause.sector = sector;
  }

  if (status) {
    whereClause.status = status;
  }

  if (shift) {
    whereClause.shift = shift;
  }

  if (product_id) {
    whereClause.product_id = product_id;
  }

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

  const { sector, product_id, start_date, end_date, status, shift, notes } = updateData;

  if (product_id) {
    const product = await Product.findByPk(product_id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    assignment.product_id = product_id;
  } else if (product_id === null) {
    assignment.product_id = null;
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
