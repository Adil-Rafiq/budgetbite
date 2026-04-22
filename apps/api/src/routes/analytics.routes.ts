import { Router } from 'express';
import { analyticsQuerySchema } from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router: Router = Router();

router.use(authMiddleware);

/** Spending summary for a date range (totalSpent, mealCount, daily breakdown). Scoped to a plan when budgetPlanId is passed. Returns { startDate, endDate, totalSpent, mealCount, daily }. */
router.get(
  '/spending',
  validate({ query: analyticsQuerySchema }),
  asyncHandler(analyticsController.getSpendingSummary),
);

/** Meal choice history for a date range (optionally scoped to a plan). Returns { data: MealHistoryItem[], meta }. */
router.get(
  '/history',
  validate({ query: analyticsQuerySchema }),
  asyncHandler(analyticsController.getMealHistory),
);

export default router;
