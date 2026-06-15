import * as notificationService from '../services/notification.service.js';

/**
 * Get current user's notifications
 * GET /api/notifications
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = await notificationService.getNotificationsForUser(userId);
    res.status(200).json({
      success: true,
      message: 'Notifications resolved successfully.',
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
export const markRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id || req.user.id;
    const notification = await notificationService.markAsRead(notificationId, userId);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    await notificationService.markAllAsRead(userId);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific notification
 * DELETE /api/notifications/:id
 */
export const deleteNotif = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id || req.user.id;
    await notificationService.deleteNotification(notificationId, userId);
    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
