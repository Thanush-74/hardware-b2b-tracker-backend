const manufacturingService = require('../services/manufacturingService');

/**
 * Manufacturing Controller
 * Beginner-friendly HTTP request handlers for Manufacturing Sector Assignments
 */

// 1. Create assignment
async function createAssignment(req, res) {
  try {
    const assignment = await manufacturingService.createAssignment(req.body);
    return res.status(201).json({
      success: true,
      message: 'Manufacturing assignment created successfully',
      data: assignment
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to create manufacturing assignment'
    });
  }
}

// 2. Get all assignments
async function getAllAssignments(req, res) {
  try {
    const result = await manufacturingService.getAllAssignments(req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch manufacturing assignments'
    });
  }
}

// 3. Get assignment by ID
async function getAssignmentById(req, res) {
  try {
    const assignment = await manufacturingService.getAssignmentById(req.params.id);
    return res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch manufacturing assignment'
    });
  }
}

// 4. Update assignment
async function updateAssignment(req, res) {
  try {
    const updated = await manufacturingService.updateAssignment(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Manufacturing assignment updated successfully',
      data: updated
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to update manufacturing assignment'
    });
  }
}

// 5. Delete assignment
async function deleteAssignment(req, res) {
  try {
    const result = await manufacturingService.deleteAssignment(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete manufacturing assignment'
    });
  }
}

// 6. Get sector summary metrics
async function getSectorSummary(req, res) {
  try {
    const summary = await manufacturingService.getSectorSummary();
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch manufacturing sector summary'
    });
  }
}

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getSectorSummary
};
