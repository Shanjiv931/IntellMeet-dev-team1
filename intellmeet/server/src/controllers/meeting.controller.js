import * as meetingService from '../services/meeting.service.js';
import aiService from '../services/ai.service.js';
import AppError from '../utils/AppError.js';
import * as notificationService from '../services/notification.service.js';

/**
 * Create a new meeting room session
 * POST /api/meetings
 */
export const createMeeting = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, scheduledDate, scheduledTime, duration } = req.body;

    if (!title) {
      throw new AppError('Meeting title must be specified.', 400);
    }

    // hostId is resolved by authenticateJWT middleware and saved in req.user
    const hostId = req.user._id || req.user.id;

    const meeting = await meetingService.createMeeting({
      title,
      description,
      hostId,
      startTime,
      endTime,
      scheduledDate,
      scheduledTime,
      duration
    });

    await notificationService.createNotification({
      userId: hostId,
      type: 'MEETING_INVITE',
      title: 'Meeting Scheduled',
      message: `Meeting "${title}" has been successfully scheduled.`
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created and scheduled successfully.',
      data: { meeting }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all scheduled or active meetings for the current user
 * GET /api/meetings
 */
export const getMyMeetings = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const meetings = await meetingService.getMeetingsForUser(userId);

    res.status(200).json({
      success: true,
      message: 'Meetings fetched successfully.',
      data: { meetings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch detailed meeting state by ID
 * GET /api/meetings/:id
 */
export const getMeetingDetails = async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    const meeting = await meetingService.getMeetingById(meetingId);

    // BOLA/IDOR Security Enforcement
    const hostId = meeting.host._id || meeting.host;
    const isHost = hostId.toString() === userId.toString();
    const isParticipant = meeting.participants && meeting.participants.some(p => {
      const pId = p._id || p;
      return pId.toString() === userId.toString();
    });
    const isAdmin = userRole === 'ADMIN';

    if (!isHost && !isParticipant && !isAdmin) {
      throw new AppError('Forbidden: Not authorized to access details of this meeting.', 403);
    }

    res.status(200).json({
      success: true,
      message: 'Meeting specifications resolved.',
      data: { meeting }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update active meeting parameters
 * PUT /api/meetings/:id
 */
export const updateMeeting = async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { title, description, status, startTime, endTime, summary, transcript, actionItems, keyDiscussionPoints, aiGenerated, lastSummarizedTranscript, scheduledDate, scheduledTime, duration } = req.body;

    const updateFields = { title, description, status, startTime, endTime, summary, transcript, actionItems, keyDiscussionPoints, aiGenerated, lastSummarizedTranscript, scheduledDate, scheduledTime, duration };

    let meeting = null;
    if (status === 'ACTIVE') {
      updateFields.startTime = startTime || new Date().toISOString();
    } else if (status === 'COMPLETED') {
      meeting = await meetingService.getMeetingById(meetingId);
      const start = new Date(meeting.startTime || meeting.createdAt || new Date());
      const end = endTime ? new Date(endTime) : new Date();
      updateFields.endTime = end.toISOString();
      updateFields.duration = Math.max(1, Math.round((end - start) / 60000));
    }

    // If meeting is being completed and transcript is provided, run Gemini AI summary
    if (status === 'COMPLETED' && transcript && transcript.trim()) {
      if (!meeting) {
        meeting = await meetingService.getMeetingById(meetingId);
      }
      // Cache check: only run Gemini if transcript has actually changed since last run
      if (!meeting.aiGenerated || meeting.lastSummarizedTranscript !== transcript) {
        const aiResult = await aiService.generateMeetingIntelligence(transcript);
        updateFields.summary = aiResult.summary;
        updateFields.keyDiscussionPoints = aiResult.keyDiscussionPoints;
        updateFields.actionItems = aiResult.actionItems;
        updateFields.aiGenerated = true;
        updateFields.lastSummarizedTranscript = transcript;
      } else {
        // Carry forward existing cached values
        updateFields.summary = meeting.summary;
        updateFields.keyDiscussionPoints = meeting.keyDiscussionPoints;
        updateFields.actionItems = meeting.actionItems;
        updateFields.aiGenerated = true;
        updateFields.lastSummarizedTranscript = meeting.lastSummarizedTranscript;
      }
    }

    // Clean up undefined properties to avoid overwriting existing document values
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    const updated = await meetingService.updateMeeting(
      meetingId,
      updateFields,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Meeting details successfully revised.',
      data: { meeting: updated }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel and delete meeting session
 * DELETE /api/meetings/:id
 */
export const deleteMeeting = async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id || req.user.id;

    await meetingService.deleteMeeting(meetingId, userId);

    res.status(200).json({
      success: true,
      message: 'Meeting session successfully deleted.',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate an on-demand AI summary for an active meeting
 * POST /api/meetings/:id/summarize
 */
export const summarizeActiveMeeting = async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      throw new AppError('Transcript content is required for AI summary generation.', 400);
    }

    const meeting = await meetingService.getMeetingById(meetingId);

    // BOLA/IDOR Security Enforcement
    const hostId = meeting.host._id || meeting.host;
    const isHost = hostId.toString() === userId.toString();
    const isParticipant = meeting.participants && meeting.participants.some(p => {
      const pId = p._id || p;
      return pId.toString() === userId.toString();
    });
    const isAdmin = userRole === 'ADMIN';

    if (!isHost && !isParticipant && !isAdmin) {
      throw new AppError('Forbidden: Not authorized to summarize this meeting.', 403);
    }

    // Cache check: Return existing details if transcript hasn't changed
    if (meeting.aiGenerated && meeting.lastSummarizedTranscript === transcript) {
      return res.status(200).json({
        success: true,
        message: 'Serving cached AI summary from database.',
        data: {
          summary: meeting.summary,
          keyDiscussionPoints: meeting.keyDiscussionPoints,
          actionItems: meeting.actionItems
        }
      });
    }

    // Call AI Service to perform Gemini summary
    const aiResult = await aiService.generateMeetingIntelligence(transcript);

    // Save summary details directly to meeting schema (caching results to MongoDB)
    const updated = await meetingService.updateMeetingSummaryInternal(meetingId, {
      summary: aiResult.summary,
      keyDiscussionPoints: aiResult.keyDiscussionPoints,
      actionItems: aiResult.actionItems,
      aiGenerated: true,
      lastSummarizedTranscript: transcript
    });

    res.status(200).json({
      success: true,
      message: 'AI summary successfully compiled.',
      data: {
        summary: updated.summary,
        keyDiscussionPoints: updated.keyDiscussionPoints,
        actionItems: updated.actionItems
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join meeting room as a participant
 * POST /api/meetings/:id/join
 */
export const joinMeeting = async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id || req.user.id;

    // Fetch the meeting details first (without BOLA checks on this specific route, since we are adding the user to the meeting)
    const meeting = await meetingService.getMeetingById(meetingId);
    
    // Add user as participant if not already host or participant
    const hostId = meeting.host._id || meeting.host;
    const isHost = hostId.toString() === userId.toString();
    const isParticipant = meeting.participants && meeting.participants.some(p => {
      const pId = p._id || p;
      return pId.toString() === userId.toString();
    });

    if (!isHost && !isParticipant) {
      await meetingService.addParticipant(meetingId, userId);
    }

    // Fetch refreshed details
    const updatedMeeting = await meetingService.getMeetingById(meetingId);

    // Trigger notification to host
    if (!isHost) {
      await notificationService.createNotification({
        userId: hostId,
        type: 'MEETING_INVITE',
        title: 'User Joined Call',
        message: `${req.user.name} has joined your meeting "${meeting.title}".`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined meeting.',
      data: { meeting: updatedMeeting }
    });
  } catch (error) {
    next(error);
  }
};
