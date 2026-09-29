const expenseService = require('../services/expenseService');

/**
 * Expense Controller
 * Beginner-friendly HTTP request handlers for Company Expenses and Revenues
 */

// 1. Create expense
async function createExpense(req, res) {
  try {
    const expenseData = {
      ...req.body,
      staff_id: req.body.staff_id || req.user?.id
    };
    const expense = await expenseService.createExpense(expenseData);
    return res.status(201).json({
      success: true,
      message: 'Expense record created successfully',
      data: expense
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to create expense record'
    });
  }
}

// 2. Get all expenses
async function getAllExpenses(req, res) {
  try {
    const result = await expenseService.getAllExpenses(req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch expense records'
    });
  }
}

// 3. Get single expense by ID
async function getExpenseById(req, res) {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    return res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch expense record'
    });
  }
}

// 4. Update expense
async function updateExpense(req, res) {
  try {
    const updated = await expenseService.updateExpense(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Expense record updated successfully',
      data: updated
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to update expense record'
    });
  }
}

// 5. Delete expense
async function deleteExpense(req, res) {
  try {
    const result = await expenseService.deleteExpense(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete expense record'
    });
  }
}

// 6. Get financial summary
async function getExpenseSummary(req, res) {
  try {
    const summary = await expenseService.getExpenseSummary(req.query);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to calculate expense summary'
    });
  }
}

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
