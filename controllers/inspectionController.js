const inspectionService = require('../services/inspectionService');

/**
 * Inspection Controller
 * Beginner-friendly HTTP request handlers for QA Inspection and Defect Tracking
 */

// 1. Create inspection
async function createInspection(req, res) {
  try {
    const inspectionData = {
      ...req.body,
      inspector_id: req.body.inspector_id || req.user?.id
    };
    const inspection = await inspectionService.createInspection(inspectionData);
    return res.status(201).json({
      success: true,
      message: 'Inspection record created successfully',
      data: inspection
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to create inspection record'
    });
  }
}

// 2. Get all inspections
async function getAllInspections(req, res) {
  try {
    const result = await inspectionService.getAllInspections(req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch inspection records'
    });
  }
}

// 3. Get single inspection by ID
async function getInspectionById(req, res) {
  try {
    const inspection = await inspectionService.getInspectionById(req.params.id);
    return res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch inspection record'
    });
  }
}

// 4. Update inspection
async function updateInspection(req, res) {
  try {
    const updated = await inspectionService.updateInspection(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Inspection record updated successfully',
      data: updated
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to update inspection record'
    });
  }
}

// 5. Delete inspection
async function deleteInspection(req, res) {
  try {
    const result = await inspectionService.deleteInspection(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete inspection record'
    });
  }
}

// 6. Get inspection summary
async function getInspectionSummary(req, res) {
  try {
    const summary = await inspectionService.getInspectionSummary(req.query);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to calculate inspection summary'
    });
  }
}

module.exports = {
  createInspection,
  getAllInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionSummary
};
