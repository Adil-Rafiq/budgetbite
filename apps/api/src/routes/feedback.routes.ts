import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as feedbackController from '../controllers/feedback.controller.js';

const router: Router = Router();

router.use(authMiddleware);

router.post('/', feedbackController.submitFeedback);

export default router;
