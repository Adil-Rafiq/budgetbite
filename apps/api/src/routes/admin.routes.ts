import { Router } from 'express';
import { z } from 'zod';
import {
  adminGetRestaurantByExternalIdSchema,
  createMealTypeSchema,
  createMenuItemsSchema,
  createRestaurantSchema,
  finishScraperRunSchema,
  listAuditLogsQuerySchema,
  listRestaurantsSchema,
  listScraperRunsQuerySchema,
  startScraperRunSchema,
  updateMealTypeSchema,
  updateMenuItemSchema,
  updateRestaurantSchema,
  uuidSchema,
} from '@repo/shared';

import { requirePermission } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as adminController from '../controllers/admin.controller.js';

const router: Router = Router();

const idParams = z.object({ id: uuidSchema });
const itemParams = z.object({ id: uuidSchema, itemId: uuidSchema });

// ─── Restaurants ──────────────────────────────────────────────────────────────

/** List all restaurants. Admin/scraper only. Returns Restaurant[]. */
router.get(
  '/restaurants',
  requirePermission('restaurant:read'),
  validate({ query: listRestaurantsSchema }),
  asyncHandler(adminController.listRestaurants),
);

/** Look up a restaurant by scraper-side externalId (used by the scraper to check for duplicates). Returns Restaurant. */
router.get(
  '/restaurants/external/:externalId',
  requirePermission('restaurant:read'),
  validate({ params: adminGetRestaurantByExternalIdSchema }),
  asyncHandler(adminController.getRestaurantByExternalId),
);

/** Get one restaurant by id. Admin/scraper only. Returns Restaurant. */
router.get(
  '/restaurants/:id',
  requirePermission('restaurant:read'),
  validate({ params: idParams }),
  asyncHandler(adminController.getRestaurantById),
);

/** Create a restaurant (used by the scraper). Returns the created Restaurant. */
router.post(
  '/restaurants',
  requirePermission('restaurant:write'),
  validate({ body: createRestaurantSchema }),
  asyncHandler(adminController.createRestaurant),
);

/** Patch restaurant fields. Returns the updated Restaurant. */
router.patch(
  '/restaurants/:id',
  requirePermission('restaurant:write'),
  validate({ params: idParams, body: updateRestaurantSchema }),
  asyncHandler(adminController.updateRestaurant),
);

/** Delete a restaurant (cascades to menu items). Returns 204. */
router.delete(
  '/restaurants/:id',
  requirePermission('restaurant:delete'),
  validate({ params: idParams }),
  asyncHandler(adminController.deleteRestaurant),
);

// ─── Menu items (nested under restaurant) ────────────────────────────────────

/** List a restaurant's menu items. Admin only. Returns MenuItem[]. */
router.get(
  '/restaurants/:id/menu-items',
  requirePermission('restaurant:read'),
  validate({ params: idParams }),
  asyncHandler(adminController.listMenuItems),
);

/** Bulk-create menu items for a restaurant (dedupes by name). Returns MenuItem | MenuItem[] depending on input. */
router.post(
  '/restaurants/:id/menu-items',
  requirePermission('restaurant:write'),
  validate({ params: idParams, body: createMenuItemsSchema }),
  asyncHandler(adminController.createMenuItems),
);

/** Patch a single menu item. Returns the updated MenuItem. */
router.patch(
  '/restaurants/:id/menu-items/:itemId',
  requirePermission('restaurant:write'),
  validate({ params: itemParams, body: updateMenuItemSchema }),
  asyncHandler(adminController.updateMenuItem),
);

/** Delete a menu item. Returns 204. */
router.delete(
  '/restaurants/:id/menu-items/:itemId',
  requirePermission('restaurant:delete'),
  validate({ params: itemParams }),
  asyncHandler(adminController.deleteMenuItem),
);

// ─── Meal types ───────────────────────────────────────────────────────────────

/** List all meal types including inactive (admin view). Returns MealType[]. */
router.get(
  '/meal-types',
  requirePermission('meal-type:read'),
  asyncHandler(adminController.listMealTypes),
);

/** Create a meal type. Returns the created MealType. */
router.post(
  '/meal-types',
  requirePermission('meal-type:write'),
  validate({ body: createMealTypeSchema }),
  asyncHandler(adminController.createMealType),
);

/** Patch a meal type (label / sortOrder / active). Returns the updated MealType. */
router.patch(
  '/meal-types/:id',
  requirePermission('meal-type:write'),
  validate({ params: idParams, body: updateMealTypeSchema }),
  asyncHandler(adminController.updateMealType),
);

/** Delete a meal type. 409 if referenced by any plan (FK restrict). Returns 204. */
router.delete(
  '/meal-types/:id',
  requirePermission('meal-type:delete'),
  validate({ params: idParams }),
  asyncHandler(adminController.deleteMealType),
);

// ─── Audit log ────────────────────────────────────────────────────────────────

/** List audit-log entries (newest first), filterable by entityType/action. Returns { data, meta }. */
router.get(
  '/audit-logs',
  requirePermission('audit:read'),
  validate({ query: listAuditLogsQuerySchema }),
  asyncHandler(adminController.listAuditLogs),
);

// ─── Scraper runs ───────────────────────────────────────────────────────────

/** List scraper runs (newest first). Returns { data, meta }. */
router.get(
  '/scraper-runs',
  requirePermission('scraper:read'),
  validate({ query: listScraperRunsQuerySchema }),
  asyncHandler(adminController.listScraperRuns),
);

/** Open a scraper run (called by the scraper before uploading). Returns the run. */
router.post(
  '/scraper-runs',
  requirePermission('scraper:write'),
  validate({ body: startScraperRunSchema }),
  asyncHandler(adminController.startScraperRun),
);

/** Close a scraper run with status + totals. Returns the updated run. */
router.patch(
  '/scraper-runs/:id',
  requirePermission('scraper:write'),
  validate({ params: idParams, body: finishScraperRunSchema }),
  asyncHandler(adminController.finishScraperRun),
);

export default router;
