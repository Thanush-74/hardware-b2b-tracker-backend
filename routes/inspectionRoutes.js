const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All inspection routes require authentication
router.use(authMiddleware);

// Quality summary metrics
router.get('/summary', requirePermission('inspection.view'), inspectionController.getInspectionSummary);

// List all inspections with filters & pagination
router.get('/', requirePermission('inspection.view'), inspectionController.getAllInspections);

// Get single inspection by ID
router.get('/:id', requirePermission('inspection.view'), inspectionController.getInspectionById);

// Create inspection
router.post('/', requirePermission('inspection.create'), inspectionController.createInspection);

// Update inspection
router.put('/:id', requirePermission('inspection.edit'), inspectionController.updateInspection);

// Delete inspection
router.delete('/:id', requirePermission('inspection.delete'), inspectionController.deleteInspection);

module.exports = router;
