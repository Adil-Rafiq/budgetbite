import { Router } from 'express';
import { z } from 'zod';
import {
  listMenuSchema,
  listRestaurantMapQuerySchema,
  listRestaurantsSchema,
  uuidSchema,
} from '@repo/shared';

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

/**
 * The same filtered set as `/`, as map pins, unpaginated. Returns RestaurantMap.
 *
 * Must stay above `/:id` — Express matches in declaration order, and `/:id`
 * would otherwise swallow "map" and reject it as a malformed uuid.
 */
router.get(
  '/map',
  optionalAuthMiddleware,
  validate({ query: listRestaurantMapQuerySchema }),
  asyncHandler(restaurantController.listRestaurantMap),
);

/** Get one restaurant by id. Public. Returns Restaurant. */
router.get(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(restaurantController.getRestaurant),
);

/** Get one filtered, sorted page of a restaurant's menu. Public. Returns ListMenuResponse. */
router.get(
  '/:id/menu',
  validate({ params: idParams, query: listMenuSchema }),
  asyncHandler(restaurantController.getMenu),
);

/**
 * Menu-wide totals and the section list. Public. Returns MenuFacets.
 *
 * Separate from /menu because it answers about the whole menu rather than the
 * page: the count the header compares against, and the categories the chips
 * offer, must not move while the reader filters.
 */
router.get(
  '/:id/menu/facets',
  validate({ params: idParams }),
  asyncHandler(restaurantController.getMenuFacets),
);

export default router;
