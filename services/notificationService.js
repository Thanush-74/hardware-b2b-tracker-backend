const { Notification, Staff, Role } = require('../models');

/**
 * Create a new notification for a specific staff member
 */
const createNotification = async ({ recipient_staff_id, title, message, type = 'system' }) => {
  if (!recipient_staff_id || !title || !message) {
    return null;
  }
  try {
    return await Notification.create({
      recipient_staff_id,
      title: title.trim(),
      message: message.trim(),
      type: type.trim(),
      is_read: false
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Broadcast notification to all active admin staff
 */
const notifyAdmins = async ({ title, message, type = 'system' }) => {
  try {
    const adminStaff = await Staff.findAll({
      where: { is_active: true },
      include: [{ model: Role, as: 'role', where: { slug: 'admin' } }]
    });

    const creations = adminStaff.map(staff =>
      Notification.create({
        recipient_staff_id: staff.id,
        title: title.trim(),
        message: message.trim(),
        type: type.trim(),
        is_read: false
      })
    );
    return await Promise.all(creations);
  } catch (err) {
    console.error('Failed to notify admins:', err.message);
    return [];
  }
};

/**
 * Get notifications for a staff member with optional filters and pagination
 */
const getNotifications = async (staffId, query = {}) => {
  const { page = 1, limit = 20, is_read } = query;
  const where = { recipient_staff_id: staffId };

  if (is_read !== undefined && is_read !== '') {
    where.is_read = is_read === 'true' || is_read === true;
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNumber - 1) * pageSize;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset
  });

  return {
    notifications: rows,
    total: count,
    page: pageNumber,
    limit: pageSize,
    totalPages: Math.ceil(count / pageSize)
  };
};

/**
 * Get unread notification count for a staff member
 */
const getUnreadCount = async (staffId) => {
  const count = await Notification.count({
    where: {
      recipient_staff_id: staffId,
      is_read: false
    }
  });
  return { count };
};

/**
 * Mark a single notification as read (ensuring ownership)
 */
const markAsRead = async (notificationId, staffId) => {
  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      recipient_staff_id: staffId
    }
  });

  if (!notification) {
    const error = new Error('Notification not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  notification.is_read = true;
  await notification.save();
  return notification;
};

/**
 * Mark all notifications as read for a staff member
 */
const markAllAsRead = async (staffId) => {
  const [updatedCount] = await Notification.update(
    { is_read: true },
    {
      where: {
        recipient_staff_id: staffId,
        is_read: false
      }
    }
  );
  return { updated_count: updatedCount };
};

module.exports = {
  createNotification,
  notifyAdmins,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
