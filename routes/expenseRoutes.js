const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All expense routes require authentication
router.use(authMiddleware);

// Get expense & revenue summary
router.get('/summary', requirePermission('expenses.view'), expenseController.getExpenseSummary);

// List all expenses with filters & pagination
router.get('/', requirePermission('expenses.view'), expenseController.getAllExpenses);

// Get single expense by ID
router.get('/:id', requirePermission('expenses.view'), expenseController.getExpenseById);

// Create expense/income
router.post('/', requirePermission('expenses.create'), expenseController.createExpense);

// Update expense
router.put('/:id', requirePermission('expenses.edit'), expenseController.updateExpense);

// Delete expense
router.delete('/:id', requirePermission('expenses.delete'), expenseController.deleteExpense);

module.exports = router;
