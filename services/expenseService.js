const { Op } = require('sequelize');
const { Expense, Staff, Role } = require('../models');

/**
 * Expense Service
 * Handles company operational expenses, revenues, and balance calculations.
 */

// 1. Create Expense/Income
async function createExpense(expenseData) {
  const {
    staff_id,
    title,
    type = 'Expense',
    category,
    amount,
    date,
    payment_method,
    reference_no,
    notes
  } = expenseData;

  if (!title || !title.trim()) {
    const error = new Error('Expense title is required');
    error.statusCode = 400;
    throw error;
  }

  if (!category || !category.trim()) {
    const error = new Error('Category is required');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Amount must be a positive number');
    error.statusCode = 400;
    throw error;
  }

  const normalizedType = type.toLowerCase() === 'income' ? 'Income' : 'Expense';

  if (staff_id) {
    const staff = await Staff.findByPk(staff_id);
    if (!staff) {
      const error = new Error('Staff member not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const expense = await Expense.create({
    staff_id: staff_id || null,
    title: title.trim(),
    type: normalizedType,
    category: category.trim(),
    amount: parsedAmount,
    date: date || new Date().toISOString().split('T')[0],
    payment_method: payment_method || 'Bank Transfer',
    reference_no: reference_no || null,
    notes: notes || null
  });

  return getExpenseById(expense.id);
}

// 2. Get all expenses with filtering, search, and pagination
async function getAllExpenses(query = {}) {
  const {
    page = 1,
    limit = 10,
    type,
    category,
    payment_method,
    staff_id,
    start_date,
    end_date,
    search
  } = query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  if (type) {
    whereClause.type = { [Op.iLike]: type };
  }

  if (category) {
    whereClause.category = { [Op.iLike]: category };
  }

  if (payment_method) {
    whereClause.payment_method = { [Op.iLike]: payment_method };
  }

  if (staff_id) {
    whereClause.staff_id = staff_id;
  }

  if (start_date && end_date) {
    whereClause.date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    whereClause.date = { [Op.gte]: start_date };
  } else if (end_date) {
    whereClause.date = { [Op.lte]: end_date };
  }

  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { reference_no: { [Op.iLike]: `%${search}%` } },
      { notes: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Expense.findAndCountAll({
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
      }
    ],
    order: [['date', 'DESC'], ['created_at', 'DESC']],
    limit: limitNum,
    offset
  });

  return {
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
    expenses: rows
  };
}

// 3. Get single expense by ID
async function getExpenseById(id) {
  const expense = await Expense.findByPk(id, {
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
      }
    ]
  });

  if (!expense) {
    const error = new Error('Expense record not found');
    error.statusCode = 404;
    throw error;
  }

  return expense;
}

// 4. Update expense
async function updateExpense(id, updateData) {
  const expense = await Expense.findByPk(id);

  if (!expense) {
    const error = new Error('Expense record not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    staff_id,
    title,
    type,
    category,
    amount,
    date,
    payment_method,
    reference_no,
    notes
  } = updateData;

  if (staff_id) {
    const staff = await Staff.findByPk(staff_id);
    if (!staff) {
      const error = new Error('Staff member not found');
      error.statusCode = 404;
      throw error;
    }
    expense.staff_id = staff_id;
  }

  if (title !== undefined) expense.title = title.trim();
  if (type !== undefined) expense.type = type.toLowerCase() === 'income' ? 'Income' : 'Expense';
  if (category !== undefined) expense.category = category.trim();
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const error = new Error('Amount must be a positive number');
      error.statusCode = 400;
      throw error;
    }
    expense.amount = parsedAmount;
  }
  if (date !== undefined) expense.date = date;
  if (payment_method !== undefined) expense.payment_method = payment_method;
  if (reference_no !== undefined) expense.reference_no = reference_no;
  if (notes !== undefined) expense.notes = notes;

  await expense.save();

  return getExpenseById(id);
}

// 5. Delete expense
async function deleteExpense(id) {
  const expense = await Expense.findByPk(id);

  if (!expense) {
    const error = new Error('Expense record not found');
    error.statusCode = 404;
    throw error;
  }

  await expense.destroy();
  return { message: 'Expense record deleted successfully' };
}

// 6. Get Financial Summary & Balance
async function getExpenseSummary(query = {}) {
  const { start_date, end_date } = query;
  const whereClause = {};

  if (start_date && end_date) {
    whereClause.date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    whereClause.date = { [Op.gte]: start_date };
  } else if (end_date) {
    whereClause.date = { [Op.lte]: end_date };
  }

  const allRecords = await Expense.findAll({
    where: whereClause,
    attributes: ['type', 'category', 'amount', 'payment_method', 'date']
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = {};
  const byPaymentMethod = {};

  allRecords.forEach(item => {
    const amt = parseFloat(item.amount) || 0;
    if (item.type === 'Income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }

    // Category breakdown
    if (!byCategory[item.category]) {
      byCategory[item.category] = { count: 0, total: 0, type: item.type };
    }
    byCategory[item.category].count += 1;
    byCategory[item.category].total = parseFloat((byCategory[item.category].total + amt).toFixed(2));

    // Payment method breakdown
    const method = item.payment_method || 'Other';
    byPaymentMethod[method] = parseFloat(((byPaymentMethod[method] || 0) + amt).toFixed(2));
  });

  const netBalance = parseFloat((totalIncome - totalExpense).toFixed(2));

  return {
    totalRecords: allRecords.length,
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpense: parseFloat(totalExpense.toFixed(2)),
    netBalance,
    byCategory,
    byPaymentMethod
  };
}

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
