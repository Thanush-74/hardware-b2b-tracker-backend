const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All production routes require authentication
router.use(authMiddleware);

// Create production record (requires production.create)
router.post('/', requirePermission('production.create'), productionController.createProduction);

// View all production records (requires production.view)
router.get('/', requirePermission('production.view'), productionController.getAllProduction);

// View production records by Product ID (requires production.view)
router.get('/product/:productId', requirePermission('production.view'), productionController.getProductionByProductId);

// View single production record (requires production.view)
router.get('/:id', requirePermission('production.view'), productionController.getProductionById);

// Update production record details (requires production.edit)
router.put('/:id', requirePermission('production.edit'), productionController.updateProduction);

// Update production status (requires production.edit)
router.patch('/:id/status', requirePermission('production.edit'), productionController.updateProductionStatus);

module.exports = router;
