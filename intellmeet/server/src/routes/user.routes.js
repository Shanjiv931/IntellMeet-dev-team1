import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all user preference endpoints - require valid login authentication
router.use(authenticateJWT);

/**
 * Settings Management Endpoints
 */
router.get('/settings', userController.getUserSettings);
router.put('/settings', userController.updateUserSettings);

/**
 * Profile & Account Security Endpoints
 */
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.delete('/account', userController.deleteAccount);

/**
 * Session Devices Management Endpoints
 */
router.get('/sessions', userController.getSessions);
router.delete('/sessions/:id', userController.terminateSession);
router.delete('/sessions', userController.terminateAllOtherSessions);

export default router;
