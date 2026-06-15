import mongoose from 'mongoose';
import Notification from '../models/Notification.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { memoryStore, isDBConnected } from '../utils/memoryStore.js';

export const getNotificationsForUser = async (userId) => {
  if (isDBConnected()) {
    try {
      return await Notification.find({ user: userId }).sort({ createdAt: -1 });
    } catch (err) {
      logger.error('Mongoose getNotificationsForUser error:', err);
      throw new AppError('Failed to fetch notifications.', 500);
    }
  }

  // Memory fallback query
  const stringId = userId.toString();
  return (memoryStore.notifications || [])
    .filter(n => n.user.toString() === stringId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const createNotification = async ({ userId, type, title, message }) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback
  const mockNotification = {
    _id: new mongoose.Types.ObjectId().toString(),
    user: userId,
    type: type || 'SYSTEM',
    title,
    message,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  memoryStore.notifications.push(mockNotification);
  logger.info(`Resilient DB Fallback: Created notification in-memory for user: ${userId}`);
  return mockNotification;
};

export const markAsRead = async (notificationId, userId) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback
  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  const index = memoryStore.notifications.findIndex(
    n => n._id.toString() === notificationId.toString() && n.user.toString() === userId.toString()
  );
  if (index === -1) {
    throw new AppError('Notification not found.', 404);
  }

  memoryStore.notifications[index].read = true;
  memoryStore.notifications[index].updatedAt = new Date();
  return memoryStore.notifications[index];
};

export const markAllAsRead = async (userId) => {
  if (isDBConnected()) {
    try {
      await Notification.updateMany({ user: userId, read: false }, { read: true });
      return true;
    } catch (err) {
      logger.error('Mongoose markAllAsRead error:', err);
      throw new AppError('Failed to mark all notifications as read.', 500);
    }
  }

  // Memory fallback
  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  const stringId = userId.toString();
  memoryStore.notifications.forEach(n => {
    if (n.user.toString() === stringId) {
      n.read = true;
      n.updatedAt = new Date();
    }
  });
  return true;
};

export const deleteNotification = async (notificationId, userId) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback
  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  const index = memoryStore.notifications.findIndex(
    n => n._id.toString() === notificationId.toString() && n.user.toString() === userId.toString()
  );
  if (index === -1) {
    throw new AppError('Notification not found.', 404);
  }

  memoryStore.notifications.splice(index, 1);
  return true;
};
