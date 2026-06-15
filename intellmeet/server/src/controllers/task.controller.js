import Task from '../models/Task.model.js';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { memoryStore, isDBConnected } from '../utils/memoryStore.js';
import * as notificationService from '../services/notification.service.js';

// Helper to escape characters for safe RegExp construction (mitigates ReDoS / RegExp Injection)
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Get all tasks
 * GET /api/tasks
 */
export const getTasks = async (req, res, next) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (isDBConnected()) {
      const tasks = await Task.find({
        $or: [
          { creator: userId },
          { assignee: userId }
        ]
      }).sort({ position: 1, createdAt: 1 });
      
      return res.status(200).json({
        success: true,
        message: 'Tasks resolved successfully.',
        data: { tasks }
      });
    }

    // Fallback: In-memory tasks
    const tasks = memoryStore.tasks.filter(t => t.creator.toString() === userId || t.assignee?.toString() === userId);
    tasks.sort((a, b) => (a.position || 0) - (b.position || 0));

    return res.status(200).json({
      success: true,
      message: 'Tasks resolved successfully.',
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 * POST /api/tasks
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, assigneeName, assignee, dueDate, meetingId, position } = req.body;

    if (!title) {
      throw new AppError('Task title must be specified.', 400);
    }

    const userId = (req.user._id || req.user.id).toString();
    let assigneeId = assignee || null;

    if (isDBConnected()) {
      // Smart auto-owner user linkage by matching text assigneeName with User model
      if (!assigneeId && assigneeName) {
        const trimmedName = assigneeName.trim();
        try {
          const matchedUser = await User.findOne({
            name: { $regex: new RegExp('^' + escapeRegExp(trimmedName) + '$', 'i') }
          });
          if (matchedUser) {
            assigneeId = matchedUser._id;
          }
        } catch (err) {
          logger.warn('Failed to auto-resolve assignee user object:', err);
        }
      }

      const task = await Task.create({
        title,
        description: description || '',
        status: status || 'TODO',
        assignee: assigneeId,
        assigneeName: assigneeName || '',
        dueDate: dueDate ? new Date(dueDate) : null,
        meetingId: meetingId || null,
        position: position || 0,
        creator: userId
      });

      const populated = await Task.findById(task._id);

      if (assigneeId) {
        await notificationService.createNotification({
          userId: assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned the task: "${title}"`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: { task: populated }
      });
    }

    // Fallback: In-memory create task
    if (!assigneeId && assigneeName) {
      const trimmedName = assigneeName.trim();
      const matchedUser = memoryStore.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
      if (matchedUser) {
        assigneeId = matchedUser._id;
      }
    }

    const task = {
      _id: new mongoose.Types.ObjectId().toString(),
      title,
      description: description || '',
      status: status || 'TODO',
      assignee: assigneeId,
      assigneeName: assigneeName || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      meetingId: meetingId || null,
      position: position || 0,
      creator: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.tasks.push(task);
    logger.info(`Resilient DB Fallback: Created task in-memory: ${task._id}`);

    if (assigneeId) {
      await notificationService.createNotification({
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned (Memory Mode)',
        message: `You have been assigned the task: "${title}"`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task details or position
 * PUT /api/tasks/:id
 */
export const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = (req.user._id || req.user.id).toString();
    const { title, description, status, assigneeName, assignee, dueDate, position } = req.body;

    if (isDBConnected()) {
      const task = await Task.findOne({
        _id: taskId,
        $or: [
          { creator: userId },
          { assignee: userId }
        ]
      });
      if (!task) {
        throw new AppError('Task not found or unauthorized to update.', 404);
      }

      const updateFields = {};
      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (status !== undefined) updateFields.status = status;
      if (dueDate !== undefined) updateFields.dueDate = dueDate ? new Date(dueDate) : null;
      if (position !== undefined) updateFields.position = position;

      if (assignee !== undefined) {
        updateFields.assignee = assignee;
      }
      if (assigneeName !== undefined) {
        updateFields.assigneeName = assigneeName;
        // Re-run matching if assigneeName was explicitly updated
        if (assigneeName && !assignee) {
          const matchedUser = await User.findOne({
            name: { $regex: new RegExp('^' + escapeRegExp(assigneeName.trim()) + '$', 'i') }
          });
          if (matchedUser) {
            updateFields.assignee = matchedUser._id;
          }
        }
      }

      const updated = await Task.findByIdAndUpdate(taskId, updateFields, {
        new: true,
        runValidators: true
      });

      if (updated.assignee && (!task.assignee || task.assignee.toString() !== updated.assignee.toString())) {
        await notificationService.createNotification({
          userId: updated.assignee,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned the task: "${updated.title}"`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: { task: updated }
      });
    }

    // Fallback: In-memory update task
    const task = memoryStore.tasks.find(t => t._id.toString() === taskId && (t.creator.toString() === userId || t.assignee?.toString() === userId));
    if (!task) {
      throw new AppError('Task not found or unauthorized to update.', 404);
    }

    const previousAssignee = task.assignee;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (position !== undefined) task.position = position;
    if (assignee !== undefined) task.assignee = assignee;
    if (assigneeName !== undefined) {
      task.assigneeName = assigneeName;
      if (assigneeName && !assignee) {
        const trimmedName = assigneeName.trim();
        const matchedUser = memoryStore.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
        if (matchedUser) {
          task.assignee = matchedUser._id;
        }
      }
    }
    task.updatedAt = new Date();

    if (task.assignee && (!previousAssignee || previousAssignee.toString() !== task.assignee.toString())) {
      await notificationService.createNotification({
        userId: task.assignee,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned (Memory Mode)',
        message: `You have been assigned the task: "${task.title}"`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = (req.user._id || req.user.id).toString();

    if (isDBConnected()) {
      const task = await Task.findOne({
        _id: taskId,
        $or: [
          { creator: userId },
          { assignee: userId }
        ]
      });
      if (!task) {
        throw new AppError('Task not found or unauthorized to delete.', 404);
      }

      await Task.findByIdAndDelete(taskId);

      return res.status(200).json({
        success: true,
        message: 'Task successfully deleted.',
        data: null
      });
    }

    // Fallback: In-memory delete task
    const index = memoryStore.tasks.findIndex(t => t._id.toString() === taskId && (t.creator.toString() === userId || t.assignee?.toString() === userId));
    if (index === -1) {
      throw new AppError('Task not found or unauthorized to delete.', 404);
    }

    memoryStore.tasks.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: 'Task successfully deleted.',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

