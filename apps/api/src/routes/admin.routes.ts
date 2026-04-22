import { Router } from 'express';
import { z } from 'zod';
import {
  adminGetRestaurantByExternalIdSchema,
  createMealTypeSchema,
  createMenuItemsSchema,
  createRestaurantSchema,
  listRestaurantsSchema,
  updateMealTypeSchema,
  updateMenuItemSchema,
  updateRestaurantSchema,
  uuidSchema,
} from '@repo/shared';

import { requireAdminOrService } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as adminController from '../controllers/admin.controller.js';

const router: Router = Router();

router.use(requireAdminOrService);

const idParams = z.object({ id: uuidSchema });
const itemParams = z.object({ id: uuidSchema, itemId: uuidSchema });

// ─── Restaurants ──────────────────────────────────────────────────────────────

/** List all restaurants. Admin/scraper only. Returns Restaurant[]. */
router.get(
  '/restaurants',
  validate({ query: listRestaurantsSchema }),
  asyncHandler(adminController.listRestaurants),
);

/** Look up a restaurant by scraper-side externalId (used by the scraper to check for duplicates). Returns Restaurant. */
router.get(
  '/restaurants/external/:externalId',
  validate({ params: adminGetRestaurantByExternalIdSchema }),
  asyncHandler(adminController.getRestaurantByExternalId),
);

/** Get one restaurant by id. Admin/scraper only. Returns Restaurant. */
router.get(
  '/restaurants/:id',
  validate({ params: idParams }),
  asyncHandler(adminController.getRestaurantById),
);

/** Create a restaurant (used by the scraper). Returns the created Restaurant. */
router.post(
  '/restaurants',
  validate({ body: createRestaurantSchema }),
  asyncHandler(adminController.createRestaurant),
);

/** Patch restaurant fields. Returns the updated Restaurant. */
router.patch(
  '/restaurants/:id',
  validate({ params: idParams, body: updateRestaurantSchema }),
  asyncHandler(adminController.updateRestaurant),
);

/** Delete a restaurant (cascades to menu items). Returns 204. */
router.delete(
  '/restaurants/:id',
  validate({ params: idParams }),
  asyncHandler(adminController.deleteRestaurant),
);

// ─── Menu items (nested under restaurant) ────────────────────────────────────

/** Bulk-create menu items for a restaurant (dedupes by name). Returns MenuItem | MenuItem[] depending on input. */
router.post(
  '/restaurants/:id/menu-items',
  validate({ params: idParams, body: createMenuItemsSchema }),
  asyncHandler(adminController.createMenuItems),
);

/** Patch a single menu item. Returns the updated MenuItem. */
router.patch(
  '/restaurants/:id/menu-items/:itemId',
  validate({ params: itemParams, body: updateMenuItemSchema }),
  asyncHandler(adminController.updateMenuItem),
);

/** Delete a menu item. Returns 204. */
router.delete(
  '/restaurants/:id/menu-items/:itemId',
  validate({ params: itemParams }),
  asyncHandler(adminController.deleteMenuItem),
);

// ─── Meal types ───────────────────────────────────────────────────────────────

/** List all meal types including inactive (admin view). Returns MealType[]. */
router.get('/meal-types', asyncHandler(adminController.listMealTypes));

/** Create a meal type. Returns the created MealType. */
router.post(
  '/meal-types',
  validate({ body: createMealTypeSchema }),
  asyncHandler(adminController.createMealType),
);

/** Patch a meal type (label / sortOrder / active). Returns the updated MealType. */
router.patch(
  '/meal-types/:id',
  validate({ params: idParams, body: updateMealTypeSchema }),
  asyncHandler(adminController.updateMealType),
);

/** Delete a meal type. 409 if referenced by any plan (FK restrict). Returns 204. */
router.delete(
  '/meal-types/:id',
  validate({ params: idParams }),
  asyncHandler(adminController.deleteMealType),
);

export default router;
