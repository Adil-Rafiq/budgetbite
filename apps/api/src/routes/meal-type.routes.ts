import { Router } from 'express';

import { asyncHandler } from '../lib/async-handler.js';
import * as mealTypeController from '../controllers/meal-type.controller.js';

const router: Router = Router();

// Public endpoint — no auth required. Meal types are a global catalog used by
// the onboarding/plan-creation flow before the user necessarily has a session.
/** List active meal types (sorted by sortOrder). Returns MealType[]. */
router.get('/', asyncHandler(mealTypeController.listMealTypes));

export default router;
