import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all notification routes with JWT authentication
router.use(authenticateJWT);

router.get('/', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotif);

export default router;
