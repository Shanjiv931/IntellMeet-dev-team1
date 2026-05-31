import * as meetingService from '../services/meeting.service.js';
import AppError from '../utils/AppError.js';

/**
 * Create a new meeting room session
 * POST /api/meetings
 */
export const createMeeting = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime } = req.body;

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
      endTime
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
    const meeting = await meetingService.getMeetingById(meetingId);

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
    const { title, description, status, startTime, endTime } = req.body;

    const updated = await meetingService.updateMeeting(
      meetingId,
      { title, description, status, startTime, endTime },
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
