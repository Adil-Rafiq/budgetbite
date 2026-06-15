import { Router } from 'express';
import {
  createRestaurantRecommendationSchema,
  listRestaurantRecommendationsQuerySchema,
} from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as recommendationController from '../controllers/restaurant-recommendation.controller.js';

const router: Router = Router();

router.use(authMiddleware);

/** Submit a restaurant recommendation. Capped at N pending per user. Returns the created recommendation. */
router.post(
  '/',
  validate({ body: createRestaurantRecommendationSchema }),
  asyncHandler(recommendationController.submitRecommendation),
);

/** List the caller's own recommendations (newest first). Returns { data, meta }. */
router.get(
  '/',
  validate({ query: listRestaurantRecommendationsQuerySchema }),
  asyncHandler(recommendationController.listMyRecommendations),
);

export default router;
