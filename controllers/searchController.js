const searchService = require('../services/searchService');
const { successResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Global search endpoint across entities
 * GET /api/search?q=<query>
 */
const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    const results = await searchService.globalSearch(q, req.user, req.permissionSlugs || []);
    return successResponse(res, 'Search results retrieved successfully', results, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  search
};
