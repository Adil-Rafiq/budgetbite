import { Router } from 'express';
import { z } from 'zod';
import { listRestaurantsSchema, uuidSchema } from '@repo/shared';

import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as restaurantController from '../controllers/restaurant.controller.js';

const router: Router = Router();

const idParams = z.object({ id: uuidSchema });

/** List restaurants with optional distance from the caller (coords pulled from user profile when logged in). Returns Restaurant[] with optional distanceKm. */
router.get(
  '/',
  optionalAuthMiddleware,
  validate({ query: listRestaurantsSchema }),
  asyncHandler(restaurantController.listRestaurants),
);

/** Get one restaurant by id. Public. Returns Restaurant. */
router.get(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(restaurantController.getRestaurant),
);

/** Get a restaurant's menu items. Public. Returns MenuItem[]. */
router.get('/:id/menu', validate({ params: idParams }), asyncHandler(restaurantController.getMenu));

export default router;
