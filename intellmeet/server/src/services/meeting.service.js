import mongoose from 'mongoose';
import Meeting from '../models/Meeting.model.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { memoryStore, isDBConnected } from '../utils/memoryStore.js';

const populateMemoryMeeting = (meeting) => {
  if (!meeting) return meeting;
  const hostId = meeting.host && (meeting.host._id || meeting.host).toString();
  const hostUser = hostId ? memoryStore.users.find(u => u._id.toString() === hostId) : null;
  
  const populatedHost = hostUser ? {
    _id: hostUser._id,
    name: hostUser.name,
    email: hostUser.email,
    role: hostUser.role,
    avatar: hostUser.avatar || ''
  } : meeting.host;

  const populatedParticipants = (meeting.participants || []).map(pId => {
    const pUser = memoryStore.users.find(u => u._id.toString() === (pId._id || pId).toString());
    return pUser ? {
      _id: pUser._id,
      name: pUser.name,
      email: pUser.email,
      role: pUser.role,
      avatar: pUser.avatar || ''
    } : pId;
  });

  return {
    ...meeting,
    host: populatedHost,
    participants: populatedParticipants
  };
};

/**
 * Create a new meeting
 */
export const createMeeting = async ({ title, description, hostId, startTime, endTime, scheduledDate, scheduledTime, duration }) => {
  const finalStartTime = startTime ? new Date(startTime) : new Date();
  
  if (isDBConnected()) {
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
      return await Meeting.findById(newMeeting._id).populate('host', 'name email role');
    } catch (err) {
      logger.error('Mongoose createMeeting error:', err);
      throw new AppError('Failed to create meeting in database.', 500);
    }
  }

  // Resilient memory mode fallback
  const mockMeeting = {
    _id: new mongoose.Types.ObjectId().toString(),
    title,
    description: description || '',
    host: hostId, // normally populated, but we can pass an object/ID
    participants: [],
    status: 'SCHEDULED',
    startTime: finalStartTime,
    endTime: endTime ? new Date(endTime) : null,
    scheduledDate,
    scheduledTime,
    duration: duration || 30,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  memoryStore.meetings.push(mockMeeting);
  logger.info(`Resilient DB Fallback: Created meeting in-memory: ${mockMeeting._id}`);
  return populateMemoryMeeting(mockMeeting);
};

/**
 * Get all meetings associated with a user (as host or participant)
 */
export const getMeetingsForUser = async (userId) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback query
  const stringId = userId.toString();
  const filtered = memoryStore.meetings.filter(m => 
    (m.host && (m.host._id || m.host).toString() === stringId) || 
    (m.participants && m.participants.some(p => (p._id || p).toString() === stringId))
  );
  const populated = filtered.map(m => populateMemoryMeeting(m));
  return populated.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
};

/**
 * Get details of a single meeting
 */
export const getMeetingById = async (meetingId) => {
  if (isDBConnected()) {
    try {
      const meeting = await Meeting.findById(meetingId).populate('participants', 'name email role');
      if (!meeting) {
        throw new AppError('Meeting not found.', 404);
      }
      return meeting;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Mongoose getMeetingById error:', err);
      throw new AppError('Failed to retrieve meeting details.', 500);
    }
  }

  // Memory fallback query
  const meeting = memoryStore.meetings.find(m => m._id.toString() === meetingId.toString());
  if (!meeting) {
    throw new AppError('Meeting not found in-memory.', 404);
  }
  return populateMemoryMeeting(meeting);
};

/**
 * Update meeting details
 */
export const updateMeeting = async (meetingId, updateFields, userId) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback query
  const index = memoryStore.meetings.findIndex(m => m._id.toString() === meetingId.toString());
  if (index === -1) {
    throw new AppError('Meeting not found in-memory.', 404);
  }

  const meeting = memoryStore.meetings[index];
  const hostId = meeting.host._id || meeting.host;
  if (hostId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to modify this meeting.', 403);
  }

  const updatedMeeting = {
    ...meeting,
    ...updateFields,
    updatedAt: new Date()
  };

  memoryStore.meetings[index] = updatedMeeting;
  logger.info(`Resilient DB Fallback: Updated meeting in-memory: ${meetingId}`);
  return populateMemoryMeeting(updatedMeeting);
};

/**
 * Delete a meeting
 */
export const deleteMeeting = async (meetingId, userId) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback query
  const index = memoryStore.meetings.findIndex(m => m._id.toString() === meetingId.toString());
  if (index === -1) {
    throw new AppError('Meeting not found in-memory.', 404);
  }

  const meeting = memoryStore.meetings[index];
  const hostId = meeting.host._id || meeting.host;
  if (hostId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to delete this meeting.', 403);
  }

  memoryStore.meetings.splice(index, 1);
  logger.info(`Resilient DB Fallback: Deleted meeting from in-memory array: ${meetingId}`);
  return true;
};

/**
 * Update meeting summary data (Internal bypass for summaries triggerable by any participant)
 */
export const updateMeetingSummaryInternal = async (meetingId, summaryData) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback query
  const index = memoryStore.meetings.findIndex(m => m._id.toString() === meetingId.toString());
  if (index === -1) {
    throw new AppError('Meeting not found in-memory.', 404);
  }

  const meeting = memoryStore.meetings[index];
  const updatedMeeting = {
    ...meeting,
    ...summaryData,
    updatedAt: new Date()
  };

  memoryStore.meetings[index] = updatedMeeting;
  logger.info(`Resilient DB Fallback: Updated meeting summary in-memory: ${meetingId}`);
  return populateMemoryMeeting(updatedMeeting);
};

/**
 * Add a participant to a meeting
 */
export const addParticipant = async (meetingId, userId) => {
  if (isDBConnected()) {
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
  }

  // Memory fallback query
  const index = memoryStore.meetings.findIndex(m => m._id.toString() === meetingId.toString());
  if (index === -1) {
    throw new AppError('Meeting not found in-memory.', 404);
  }

  const meeting = memoryStore.meetings[index];
  if (!meeting.participants) {
    meeting.participants = [];
  }
  
  const stringId = userId.toString();
  if (!meeting.participants.some(p => (p._id || p).toString() === stringId)) {
    meeting.participants.push(userId);
  }
  
  meeting.updatedAt = new Date();
  logger.info(`Resilient DB Fallback: Added participant in-memory to meeting: ${meetingId}`);
  return populateMemoryMeeting(meeting);
};

