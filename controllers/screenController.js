const screenService = require('../services/screenService');
const { successResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Get all screens
 * GET /api/screens
 */
const getAllScreens = async (req, res, next) => {
  try {
    const screens = await screenService.getAllScreens();
    return successResponse(res, 'Screens retrieved successfully', screens, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllScreens
};
