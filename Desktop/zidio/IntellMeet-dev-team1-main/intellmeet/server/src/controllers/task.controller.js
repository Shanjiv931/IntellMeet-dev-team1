import Task from '../models/Task.model.js';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Get all tasks
 * GET /api/tasks
 */
export const getTasks = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const tasks = await Task.find({
      $or: [
        { creator: userId },
        { assignee: userId }
      ]
    }).sort({ position: 1, createdAt: 1 });
    res.status(200).json({
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

    let assigneeId = assignee || null;

    // Smart auto-owner user linkage by matching text assigneeName with User model
    if (!assigneeId && assigneeName) {
      const trimmedName = assigneeName.trim();
      try {
        const matchedUser = await User.findOne({
          name: { $regex: new RegExp('^' + trimmedName + '$', 'i') }
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
      creator: req.user._id || req.user.id
    });

    const populated = await Task.findById(task._id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task: populated }
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
    const userId = req.user._id || req.user.id;
    const { title, description, status, assigneeName, assignee, dueDate, position } = req.body;

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
          name: { $regex: new RegExp('^' + assigneeName.trim() + '$', 'i') }
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

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task: updated }
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
    const userId = req.user._id || req.user.id;

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

    const deleted = await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task successfully deleted.',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
