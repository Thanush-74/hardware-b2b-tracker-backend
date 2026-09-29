const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All return routes require authentication
router.use(authMiddleware);

// Create return request (requires returns.create)
router.post('/', requirePermission('returns.create'), returnController.createReturn);

// View all returns (requires returns.view)
router.get('/', requirePermission('returns.view'), returnController.getAllReturns);

// View single return record (requires returns.view)
router.get('/:id', requirePermission('returns.view'), returnController.getReturnById);

// Update general return info (requires returns.edit)
router.put('/:id', requirePermission('returns.edit'), returnController.updateReturn);

// Update return status (requires returns.edit)
router.patch('/:id/status', requirePermission('returns.edit'), returnController.updateReturnStatus);

// Record replacement details (requires returns.edit)
router.patch('/:id/replacement', requirePermission('returns.edit'), returnController.recordReplacement);

module.exports = router;
