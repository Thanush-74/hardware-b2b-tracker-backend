const express = require('express');
const router = express.Router();
const manufacturingController = require('../controllers/manufacturingController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All manufacturing endpoints require valid authentication
router.use(authMiddleware);

// Sector summary
router.get('/summary', requirePermission('manufacturing.view'), manufacturingController.getSectorSummary);

// List all assignments with filters & pagination
router.get('/', requirePermission('manufacturing.view'), manufacturingController.getAllAssignments);

// Get single assignment
router.get('/:id', requirePermission('manufacturing.view'), manufacturingController.getAssignmentById);

// Create assignment
router.post('/', requirePermission('manufacturing.create'), manufacturingController.createAssignment);

// Update assignment
router.put('/:id', requirePermission('manufacturing.edit'), manufacturingController.updateAssignment);

// Delete assignment
router.delete('/:id', requirePermission('manufacturing.delete'), manufacturingController.deleteAssignment);

module.exports = router;
