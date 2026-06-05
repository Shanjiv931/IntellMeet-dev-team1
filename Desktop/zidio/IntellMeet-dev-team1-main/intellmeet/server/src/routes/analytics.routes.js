import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all analytics endpoints - require valid login authentication
router.use(authenticateJWT);

router.get('/', analyticsController.getAnalytics);

export default router;
