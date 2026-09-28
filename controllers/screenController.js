const screenService = require('../services/screenService');
const { successResponse } = require('../utils/response');

/**
 * Get all screens
 * GET /api/screens
 */
const getAllScreens = async (req, res, next) => {
  try {
    const screens = await screenService.getAllScreens();
    return successResponse(res, 'Screens retrieved successfully', screens, 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllScreens
};
