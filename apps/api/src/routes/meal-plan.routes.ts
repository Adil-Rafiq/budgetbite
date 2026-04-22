import { Router } from 'express';
import { getSuggestionsSchema } from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as mealPlanController from '../controllers/meal-plan.controller.js';

const router: Router = Router();

router.use(authMiddleware);

/** Get suggested meal options for a date from the caller's active plan's latest generation. Returns { date, slots: [{ mealTypeId, mealTypeKey, mealTypeLabel, options: [...] }] }. */
router.get(
  '/suggestions',
  validate({ query: getSuggestionsSchema }),
  asyncHandler(mealPlanController.getSuggestions),
);

export default router;
