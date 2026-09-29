const { Staff, Role, Permission, Screen } = require('../models');
const { hashPassword } = require('../utils/password');
const { Op } = require('sequelize');

/**
 * Create a new staff member (Admin only)
 */
const createStaff = async ({ first_name, last_name, email, password, role_id }) => {
  if (!first_name || !last_name || !email || !password || !role_id) {
    const error = new Error('First name, last name, email, password, and role_id are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    const error = new Error('Invalid email format');
    error.statusCode = 400;
    throw error;
  }

  // Check email uniqueness
  const existingStaff = await Staff.findOne({ where: { email: normalizedEmail } });
  if (existingStaff) {
    const error = new Error('A staff member with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Validate role exists
  const role = await Role.findByPk(role_id);
  if (!role) {
    const error = new Error('Specified role does not exist');
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const password_hash = await hashPassword(password);

  const staff = await Staff.create({
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: normalizedEmail,
    password_hash,
    role_id,
    is_active: true
  });

  return {
    id: staff.id,
    first_name: staff.first_name,
    last_name: staff.last_name,
    email: staff.email,
    role_id: staff.role_id,
    role: {
      id: role.id,
      name: role.name,
      slug: role.slug
    },
    is_active: staff.is_active,
    created_at: staff.created_at,
    updated_at: staff.updated_at
  };
};

/**
 * Get all staff members with optional filtering
 */
const getAllStaff = async (query = {}) => {
  const { page = 1, limit = 50, search, role_id, is_active } = query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (role_id) {
    where.role_id = role_id;
  }

  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true' || is_active === true;
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const pageSize = parseInt(limit, 10);

  const { rows, count } = await Staff.findAndCountAll({
    where,
    attributes: { exclude: ['password_hash'] },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'slug']
      }
    ],
    order: [['id', 'ASC']],
    limit: pageSize,
    offset
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / pageSize),
    staff: rows
  };
};

/**
 * Get single staff member by ID with role and permissions
 */
const getStaffById = async (id) => {
  const staff = await Staff.findByPk(id, {
    attributes: { exclude: ['password_hash'] },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'slug'],
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] }
          }
        ]
      }
    ]
  });

  if (!staff) {
    const error = new Error('Staff member not found');
    error.statusCode = 404;
    throw error;
  }

  return staff;
};

/**
 * Update staff member details
 */
const updateStaff = async (id, { first_name, last_name, email, role_id, password }) => {
  const staff = await Staff.findByPk(id);
  if (!staff) {
    const error = new Error('Staff member not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (first_name) updateFields.first_name = first_name.trim();
  if (last_name) updateFields.last_name = last_name.trim();

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== staff.email) {
      const existing = await Staff.findOne({ where: { email: normalizedEmail } });
      if (existing) {
        const error = new Error('A staff member with this email already exists');
        error.statusCode = 409;
        throw error;
      }
      updateFields.email = normalizedEmail;
    }
  }

  if (role_id) {
    const role = await Role.findByPk(role_id);
    if (!role) {
      const error = new Error('Specified role does not exist');
      error.statusCode = 400;
      throw error;
    }
    updateFields.role_id = role_id;
  }

  if (password) {
    if (password.length < 6) {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }
    updateFields.password_hash = await hashPassword(password);
  }

  await staff.update(updateFields);

  return await getStaffById(staff.id);
};

/**
 * Update staff active status
 */
const updateStaffStatus = async (id, is_active) => {
  if (typeof is_active !== 'boolean') {
    const error = new Error('is_active boolean field is required');
    error.statusCode = 400;
    throw error;
  }

  const staff = await Staff.findByPk(id);
  if (!staff) {
    const error = new Error('Staff member not found');
    error.statusCode = 404;
    throw error;
  }

  await staff.update({ is_active });

  return {
    id: staff.id,
    first_name: staff.first_name,
    last_name: staff.last_name,
    email: staff.email,
    is_active: staff.is_active,
    updated_at: staff.updated_at
  };
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus
};
