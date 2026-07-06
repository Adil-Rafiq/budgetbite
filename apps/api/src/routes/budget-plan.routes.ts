import { Router } from 'express';
import { z } from 'zod';
import {
  createBudgetPlanSchema,
  createMealPinSchema,
  getPlanTimelineQuerySchema,
  listBudgetPlansQuerySchema,
  listMealPinsQuerySchema,
  paginationSchema,
  recordMealChoiceSchema,
  rerollSlotSchema,
  updateBudgetPlanSchema,
  uuidSchema,
} from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { slotRerollRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as budgetPlanController from '../controllers/budget-plan.controller.js';
import * as mealPinController from '../controllers/meal-pin.controller.js';

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

/** Patch plan metadata (totalBudget / notificationTimes). Lifecycle transitions go through POST /:id/cancel. Returns BudgetPlanResponse. */
router.patch(
  '/:id',
  validate({ params: idParams, body: updateBudgetPlanSchema }),
  asyncHandler(budgetPlanController.updatePlan),
);

/** Cancel a plan and atomically supersede any in-flight generation. Idempotency-guarded via 409 on already-terminal states. Returns BudgetPlanResponse. */
router.post(
  '/:id/cancel',
  validate({ params: idParams }),
  asyncHandler(budgetPlanController.cancelPlan),
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

/** Kick off AI suggestions. Returns 202 with { generationId, budgetPlanId, generatedAt }; the LLM runs in the background and the FE polls for the result. */
router.post(
  '/:id/meal-plan/generate',
  validate({ params: idParams }),
  asyncHandler(budgetPlanController.generateMealPlan),
);

/** Regenerate the 3 options for one (slotDate, mealTypeId) slot, synchronously. Treats the replaced options as implicit "none of these" feedback. Returns RerollSlotResponse. */
router.post(
  '/:id/meal-plan/reroll-slot',
  slotRerollRateLimiter,
  validate({ params: idParams, body: rerollSlotSchema }),
  asyncHandler(budgetPlanController.rerollSlot),
);

/** Paginated list of every generation attempt for a plan, newest-first. Returns { data: BudgetGeneration[], meta }. */
router.get(
  '/:id/generations',
  validate({ params: idParams, query: paginationSchema }),
  asyncHandler(budgetPlanController.listGenerations),
);

/** Get one generation row + grouped suggestions (empty `days` for non-succeeded statuses). Returns BudgetGenerationDetailResponse. */
router.get(
  '/:id/generations/:gid',
  validate({ params: z.object({ id: uuidSchema, gid: uuidSchema }) }),
  asyncHandler(budgetPlanController.getGenerationDetail),
);

/** Pin/choice/suggestion-merged day-by-day timeline across the plan's full date range. Returns PlanTimelineResponse. */
router.get(
  '/:id/timeline',
  validate({ params: idParams, query: getPlanTimelineQuerySchema }),
  asyncHandler(budgetPlanController.getPlanTimeline),
);

// ─── Meal pins (user-locked future slots) ────────────────────────────────────

/** Upsert a pin for (slotDate, mealTypeId). Server snapshots priceAtPin from menuItem.price. Returns MealPinResponse. */
router.post(
  '/:id/meal-pins',
  validate({ params: idParams, body: createMealPinSchema }),
  asyncHandler(mealPinController.createPin),
);

/** List pins for the plan (defaults to today onwards). Returns MealPinResponse[]. */
router.get(
  '/:id/meal-pins',
  validate({ params: idParams, query: listMealPinsQuerySchema }),
  asyncHandler(mealPinController.listPins),
);

/** Delete a pin by id. Idempotent on re-delete (404 on second call). Returns 204. */
router.delete(
  '/:id/meal-pins/:pinId',
  validate({ params: z.object({ id: uuidSchema, pinId: uuidSchema }) }),
  asyncHandler(mealPinController.deletePin),
);

export default router;
