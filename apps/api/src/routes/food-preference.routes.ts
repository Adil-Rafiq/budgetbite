import { Router } from 'express';
import { upsertFoodPreferenceSchema, deleteFoodPreferenceSchema } from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as foodPreferenceController from '../controllers/food-preference.controller.js';

const router: Router = Router();

router.use(authMiddleware);

/** List the caller's favorites & blocked restaurants/dishes. */
router.get('/', asyncHandler(foodPreferenceController.listFoodPreferences));

/** Create or flip the sentiment of a favorite/block for a restaurant or dish. */
router.post(
  '/',
  validate({ body: upsertFoodPreferenceSchema }),
  asyncHandler(foodPreferenceController.upsertFoodPreference),
);

/** Remove a favorite/block by target ({ targetType, targetId }). */
router.delete(
  '/',
  validate({ body: deleteFoodPreferenceSchema }),
  asyncHandler(foodPreferenceController.deleteFoodPreference),
);

export default router;
