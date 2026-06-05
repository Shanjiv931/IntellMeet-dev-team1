import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all task endpoints - require valid JWT authentication
router.use(authenticateJWT);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;
