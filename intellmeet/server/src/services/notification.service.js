import mongoose from 'mongoose';
import Notification from '../models/Notification.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

export const getNotificationsForUser = async (userId) => {
  try {
    return await Notification.find({ user: userId }).sort({ createdAt: -1 });
  } catch (err) {
    logger.error('Mongoose getNotificationsForUser error:', err);
    throw new AppError('Failed to fetch notifications.', 500);
  }
};

export const createNotification = async ({ userId, type, title, message }) => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
    });
  } catch (err) {
    logger.error('Mongoose createNotification error:', err);
    // Fallback silently without throwing to keep parent operations running
    logger.warn('Failed to save DB notification, continuing.');
    return null;
  }
};

export const markAsRead = async (notificationId, userId) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    if (!updated) {
      throw new AppError('Notification not found.', 404);
    }
    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Mongoose markAsRead error:', err);
    throw new AppError('Failed to mark notification as read.', 500);
  }
};

export const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    return true;
  } catch (err) {
    logger.error('Mongoose markAllAsRead error:', err);
    throw new AppError('Failed to mark all notifications as read.', 500);
  }
};

export const deleteNotification = async (notificationId, userId) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
    if (!deleted) {
      throw new AppError('Notification not found.', 404);
    }
    return true;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Mongoose deleteNotification error:', err);
    throw new AppError('Failed to delete notification.', 500);
  }
};
