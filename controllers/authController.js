const authService = require('../services/authService');
const { successResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Staff login controller
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, 'Login successful', result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login
};
