const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/adminMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All staff routes require authentication
router.use(authMiddleware);

// Admin only: Create staff
router.post('/', requireAdmin, staffController.createStaff);

// View staff list: require staff.view permission
router.get('/', requirePermission('staff.view'), staffController.getAllStaff);

// Staff specific permissions
router.get('/:staffId/permissions', permissionController.getStaffPermissions);
router.put('/:staffId/permissions', requireAdmin, permissionController.updateStaffPermissions);

// Single staff details
router.get('/:id', requirePermission('staff.view'), staffController.getStaffById);

// Admin only: Update staff details & roles
router.put('/:id', requireAdmin, staffController.updateStaff);

// Admin only: Update staff active status
router.patch('/:id/status', requireAdmin, staffController.updateStaffStatus);

module.exports = router;
