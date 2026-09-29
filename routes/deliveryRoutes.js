const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All delivery routes require authentication
router.use(authMiddleware);

// Create delivery (requires deliveries.create)
router.post('/', requirePermission('deliveries.create'), deliveryController.createDelivery);

// View all deliveries (requires deliveries.view)
router.get('/', requirePermission('deliveries.view'), deliveryController.getAllDeliveries);

// View single delivery (requires deliveries.view)
router.get('/:id', requirePermission('deliveries.view'), deliveryController.getDeliveryById);

// Update delivery details (requires deliveries.edit)
router.put('/:id', requirePermission('deliveries.edit'), deliveryController.updateDelivery);

// Update delivery status (requires deliveries.edit)
router.patch('/:id/status', requirePermission('deliveries.edit'), deliveryController.updateDeliveryStatus);

// Assign delivery employee (requires deliveries.edit)
router.patch('/:id/assign', requirePermission('deliveries.edit'), deliveryController.assignDeliveryStaff);

module.exports = router;
