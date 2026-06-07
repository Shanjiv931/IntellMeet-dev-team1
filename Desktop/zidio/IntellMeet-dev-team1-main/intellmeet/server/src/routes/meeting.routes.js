import { Router } from 'express';
import * as meetingController from '../controllers/meeting.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all meeting endpoints - require a valid JWT Bearer header
router.use(authenticateJWT);

/**
 * Meeting CRUD Pipeline
 */
router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getMyMeetings);
router.get('/:id', meetingController.getMeetingDetails);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);
router.post('/:id/summarize', meetingController.summarizeActiveMeeting);

export default router;
