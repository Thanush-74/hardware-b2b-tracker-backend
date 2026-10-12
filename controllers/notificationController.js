const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/response');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Get notifications for authenticated user
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications(req.user.id, req.query);
    return successResponse(res, 'Notifications retrieved successfully', result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    return successResponse(res, 'Unread notification count retrieved successfully', result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.id);
    return successResponse(res, 'Notification marked as read successfully', result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, 'All notifications marked as read successfully', result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
