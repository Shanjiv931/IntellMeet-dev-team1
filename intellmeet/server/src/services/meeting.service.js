import mongoose from 'mongoose';
import Meeting from '../models/Meeting.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Create a new meeting
 */
export const createMeeting = async ({ title, description, hostId, startTime, endTime, scheduledDate, scheduledTime, duration }) => {
  if (!title || !title.trim()) {
    throw new AppError('Meeting title is required.', 400);
  }

  if (!hostId) {
    throw new AppError('Meeting host ID is required.', 400);
  }

  // Parse startTime, default to now if not provided
  let finalStartTime = new Date();
  if (startTime) {
    finalStartTime = new Date(startTime);
    if (isNaN(finalStartTime.getTime())) {
      throw new AppError('Invalid meeting start time format.', 400);
    }
  }

  try {
    const newMeeting = await Meeting.create({
      title,
      description,
      host: hostId,
      startTime: finalStartTime,
      endTime: endTime ? new Date(endTime) : null,
      scheduledDate,
      scheduledTime,
      duration: duration || 30,
      status: 'SCHEDULED'
    });
    return await Meeting.findById(newMeeting._id).populate('host', 'name email role avatar');
  } catch (err) {
    logger.error('Mongoose createMeeting error:', err);
    throw new AppError('Failed to create meeting in database.', 500);
  }
};

/**
 * Get all meetings associated with a user (as host or participant)
 */
export const getMeetingsForUser = async (userId) => {
  try {
    return await Meeting.find({
      $or: [
        { host: userId },
        { participants: userId }
      ]
    }).sort({ startTime: -1 });
  } catch (err) {
    logger.error('Mongoose getMeetingsForUser error:', err);
    throw new AppError('Failed to fetch user meetings.', 500);
  }
};

/**
 * Get details of a single meeting
 */
export const getMeetingById = async (meetingId) => {
  try {
    const meeting = await Meeting.findById(meetingId).populate('participants', 'name email role avatar');
    if (!meeting) {
      throw new AppError('Meeting not found.', 404);
    }
    return meeting;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Mongoose getMeetingById error:', err);
    throw new AppError('Failed to retrieve meeting details.', 500);
  }
};

/**
 * Update meeting details
 */
export const updateMeeting = async (meetingId, updateFields, userId) => {
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found.', 404);
    }

    // Check permissions (only host can update)
    const hostId = meeting.host._id || meeting.host;
    if (hostId.toString() !== userId.toString()) {
      throw new AppError('Not authorized to modify this meeting.', 403);
    }

    const updated = await Meeting.findByIdAndUpdate(meetingId, updateFields, {
      new: true,
      runValidators: true
    });
    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Mongoose updateMeeting error:', err);
    throw new AppError('Failed to update meeting.', 500);
  }
};

/**
 * Delete a meeting
 */
export const deleteMeeting = async (meetingId, userId) => {
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found.', 404);
    }

    const hostId = meeting.host._id || meeting.host;
    if (hostId.toString() !== userId.toString()) {
      throw new AppError('Not authorized to delete this meeting.', 403);
    }

    await Meeting.findByIdAndDelete(meetingId);
    return true;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Mongoose deleteMeeting error:', err);
    throw new AppError('Failed to delete meeting.', 500);
  }
};

/**
 * Update meeting summary data (Internal bypass for summaries triggerable by any participant)
 */
export const updateMeetingSummaryInternal = async (meetingId, summaryData) => {
  try {
    const updated = await Meeting.findByIdAndUpdate(meetingId, summaryData, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      throw new AppError('Meeting not found.', 404);
    }
    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Mongoose updateMeetingSummaryInternal error:', err);
    throw new AppError('Failed to update meeting summary.', 500);
  }
};

/**
 * Add a participant to a meeting
 */
export const addParticipant = async (meetingId, userId) => {
  try {
    return await Meeting.findByIdAndUpdate(
      meetingId,
      { $addToSet: { participants: userId } },
      { new: true }
    );
  } catch (err) {
    logger.error('Mongoose addParticipant error:', err);
    throw new AppError('Failed to add participant to meeting.', 500);
  }
};
