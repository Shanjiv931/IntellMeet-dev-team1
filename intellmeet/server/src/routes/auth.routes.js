import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

/**
 * Public Authentication Routes (Rate-limited to protect against automated scripting)
 */
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);

/**
 * Protected Authentication Routes (Requires valid Bearer JWT header authorization)
 */
router.get('/me', authenticateJWT, authController.getMe);

export default router;
