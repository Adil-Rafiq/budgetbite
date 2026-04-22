import { Router } from 'express';
import { feedbackSchema } from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as feedbackController from '../controllers/feedback.controller.js';

const router: Router = Router();

router.use(authMiddleware);

/** Upsert feedback (rating / liked / comment) for one of the caller's meal choices. Returns the feedback row. */
router.post(
  '/',
  validate({ body: feedbackSchema }),
  asyncHandler(feedbackController.submitFeedback),
);

export default router;
