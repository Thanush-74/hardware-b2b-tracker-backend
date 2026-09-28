const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/adminMiddleware');

// All role routes require authentication
router.use(authMiddleware);

// Get all roles
router.get('/', roleController.getAllRoles);

// Role permissions
router.get('/:roleId/permissions', permissionController.getRolePermissions);
router.put('/:roleId/permissions', requireAdmin, permissionController.updateRolePermissions);

// Get role by ID
router.get('/:id', roleController.getRoleById);

module.exports = router;
