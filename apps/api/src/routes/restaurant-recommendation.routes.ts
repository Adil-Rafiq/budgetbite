import { Router } from 'express';
import { z } from 'zod';
import {
  createRestaurantRecommendationSchema,
  extractMenuFromImageSchema,
  listRestaurantRecommendationsQuerySchema,
  uuidSchema,
} from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { menuExtractionRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as recommendationController from '../controllers/restaurant-recommendation.controller.js';

const router: Router = Router();

const idParams = z.object({ id: uuidSchema });

router.use(authMiddleware);

/** Submit a restaurant recommendation. Capped at N pending per user. Returns the created recommendation. */
router.post(
  '/',
  validate({ body: createRestaurantRecommendationSchema }),
  asyncHandler(recommendationController.submitRecommendation),
);

/**
 * AI-extract menu items from an uploaded menu photo to pre-fill the
 * recommendation form. Per-user rate limited on top of the global limiter
 * (every hit is a multimodal LLM call). Returns { items } — possibly empty
 * when the photo isn't a legible menu.
 */
router.post(
  '/extract-menu-image',
  menuExtractionRateLimiter,
  validate({ body: extractMenuFromImageSchema }),
  asyncHandler(recommendationController.extractMenuFromImage),
);

/** List the caller's own recommendations (newest first). Returns { data, meta }. */
router.get(
  '/',
  validate({ query: listRestaurantRecommendationsQuerySchema }),
  asyncHandler(recommendationController.listMyRecommendations),
);

/** Withdraw (delete) one of the caller's own recommendations while it's still pending. Returns 204. */
router.delete(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(recommendationController.withdrawRecommendation),
);

export default router;
