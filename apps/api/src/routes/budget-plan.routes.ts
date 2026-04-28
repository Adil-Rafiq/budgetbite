import { Router } from 'express';
import { z } from 'zod';
import {
  createBudgetPlanSchema,
  listBudgetPlansQuerySchema,
  paginationSchema,
  recordMealChoiceSchema,
  updateBudgetPlanSchema,
  uuidSchema,
} from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as budgetPlanController from '../controllers/budget-plan.controller.js';

const router: Router = Router();

router.use(authMiddleware);

const idParams = z.object({ id: uuidSchema });

/** Create a new budget plan for the caller. Seeds plan_context in the same transaction. Returns BudgetPlanResponse. */
router.post(
  '/',
  validate({ body: createBudgetPlanSchema }),
  asyncHandler(budgetPlanController.createPlan),
);

/** List the caller's budget plans (with mealTypes + spent/remaining embedded). Returns { data: BudgetPlanResponse[], meta }. */
router.get(
  '/',
  validate({ query: listBudgetPlansQuerySchema }),
  asyncHandler(budgetPlanController.listPlans),
);

/** Get the caller's active plan with running budget state. Returns { plan, budgetState } or null. */
router.get('/active', asyncHandler(budgetPlanController.getActivePlan));

/** Get full detail for one plan (context + mealTypes + activeGeneration + latestAttempt). Returns BudgetPlanDetail. */
router.get('/:id', validate({ params: idParams }), asyncHandler(budgetPlanController.getPlanById));

/** Patch plan metadata (totalBudget / notificationTimes / status). Returns BudgetPlanResponse. */
router.patch(
  '/:id',
  validate({ params: idParams, body: updateBudgetPlanSchema }),
  asyncHandler(budgetPlanController.updatePlan),
);

/** Get only the running budget state (amountSpent, mealsRemaining, etc.) for a plan. Returns BudgetStateContext. */
router.get(
  '/:id/context',
  validate({ params: idParams }),
  asyncHandler(budgetPlanController.getPlanContext),
);

/** List confirmed meal choices on a plan. Returns { data: MealChoiceResponse[], meta }. */
router.get(
  '/:id/choices',
  validate({ params: idParams, query: paginationSchema }),
  asyncHandler(budgetPlanController.listChoices),
);

// TODO: Create a choices endpoint that returns choices of the day or if given specific date then returns that day's choices

/** Record a confirmed meal choice and atomically update plan_context. Returns MealChoiceResponse. */
router.post(
  '/:id/choices',
  validate({ params: idParams, body: recordMealChoiceSchema }),
  asyncHandler(budgetPlanController.recordChoice),
);

/** Create a new meal_plan_generation for this plan (kick off AI suggestions). Returns { generationId, budgetPlanId, generatedAt }. */
router.post(
  '/:id/meal-plan/generate',
  validate({ params: idParams }),
  asyncHandler(budgetPlanController.generateMealPlan),
);

export default router;
