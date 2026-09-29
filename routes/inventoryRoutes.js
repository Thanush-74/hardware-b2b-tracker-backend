const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All inventory routes require authentication
router.use(authMiddleware);

// View all inventory records (requires inventory.view)
router.get('/', requirePermission('inventory.view'), inventoryController.getAllInventory);

// View single inventory record (requires inventory.view)
router.get('/:id', requirePermission('inventory.view'), inventoryController.getInventoryById);

// Update inventory stock (requires inventory.edit)
router.put('/:id', requirePermission('inventory.edit'), inventoryController.updateStock);

// Increase stock (requires inventory.edit)
router.post('/:id/increase', requirePermission('inventory.edit'), inventoryController.increaseStock);

// Decrease stock (requires inventory.edit)
router.post('/:id/decrease', requirePermission('inventory.edit'), inventoryController.decreaseStock);

module.exports = router;
