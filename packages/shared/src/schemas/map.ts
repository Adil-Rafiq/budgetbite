import { z } from 'zod';

import { uuidSchema } from './common.js';
import { listRestaurantsSchema } from './restaurant.js';

/**
 * Payloads for the two maps: the admin coverage instrument (`/admin/map`) and
 * the user-facing restaurant map (`/restaurants?view=map`).
 *
 * Both are deliberately *not* the resource DTOs. A map holds every matching row
 * at once rather than a page of twenty, so a pin carries only what a pin draws
 * or a popup reads — `restaurantSchema` would put an image URL, an order URL
 * and a slug on the wire five hundred times over for no pixel.
 */

// ─── Shared pin base ─────────────────────────────────────────────────────────

/**
 * Coordinates are non-nullable here, unlike `restaurantSchema`, whose lat/lng
 * are `.nullable()`. That looseness is the DTO's alone — `restaurant.latitude`
 * and `.longitude` are both `NOT NULL` columns — and a map is the one consumer
 * that cannot carry it: a pin without a position is not a pin. Tightening it
 * here means no marker component has to answer "what do I draw at null".
 */
const mapPinBaseSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ─── Admin coverage map ──────────────────────────────────────────────────────

export const adminMapPinSchema = mapPinBaseSchema.extend({
  source: z.enum(['foodpanda', 'community']),
  /** Drives the "no menu items" filter — the defect that makes a place unorderable. */
  menuItemCount: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).nullable(),
  /** Backs the "stale" filter, using the same cutoff `dataQuality()` reports on. */
  updatedAt: z.coerce.date(),
  /**
   * (0, 0), or implausibly far from the rest of the catalogue. Computed by
   * `flagOutliers` in the service rather than stored — it is a judgement about
   * a row relative to its neighbours, and it changes as the catalogue grows.
   */
  isOutlier: z.boolean(),
});

/**
 * One bin of the user-density grid, addressed by its south-west corner. The
 * cell spans `cellDegrees` in both axes from there.
 *
 * There is no user id, no name and no exact coordinate in this shape, and that
 * is the privacy guarantee: the API cannot leak a home address it never sends.
 * Cells below `minCellCount` are dropped in SQL, so they are not merely hidden
 * from the UI — they never leave the database.
 */
export const userDensityCellSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  count: z.number().int().positive(),
});

export const adminMapSchema = z.object({
  restaurants: z.array(adminMapPinSchema),
  /** Total rows in the catalogue, which exceeds `restaurants.length` when truncated. */
  restaurantsTotal: z.number().int().nonnegative(),
  /** True when the pin cap was hit and the map is showing a subset. */
  truncated: z.boolean(),
  /** The cutoff the "stale" filter uses — the same one `dataQuality()` reports. */
  staleDays: z.number().int().positive(),

  userCells: z.array(userDensityCellSchema),
  /** Grid resolution in degrees, so the legend can state the cell size. */
  cellDegrees: z.number().positive(),
  /** The k in k-anonymity: no returned cell holds fewer users than this. */
  minCellCount: z.number().int().positive(),
  /**
   * Users whose cell was suppressed for being too sparse.
   *
   * Reported rather than silently dropped: without it the totals do not add up,
   * and an operator who notices that gap has to guess whether it means "no
   * users there" or "a bug". The number itself pinpoints nobody.
   */
  usersInSuppressedCells: z.number().int().nonnegative(),
  /** Signed up but never finished the location step — invisible on any map. */
  usersWithoutLocation: z.number().int().nonnegative(),
  userTotal: z.number().int().nonnegative(),
});

// ─── User-facing restaurant map ──────────────────────────────────────────────

/**
 * A restaurant as the user's map draws it.
 *
 * Carries the four *inputs* to a meal's cost rather than the cost itself, so
 * the popup calls the same `typicalMealCost()` + `classifyBudgetFit()` the
 * cards on the list view already call. A server-computed figure here would be
 * a second implementation of the product's central claim, free to disagree with
 * the card for the same restaurant on the same screen.
 */
export const restaurantMapPinSchema = mapPinBaseSchema.extend({
  rating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  distanceKm: z.number().min(0).optional(),
  minItemPrice: z.number().nullable(),
  avgItemPrice: z.number().nullable(),
  deliveryFee: z.number().min(0).nullable(),
  minimumOrder: z.number().min(0).nullable(),
});

/**
 * The list view's filters, minus pagination. A map cannot page — showing pins
 * 1–24 of 200 would draw a map of an arbitrary quarter of the city.
 */
export const listRestaurantMapQuerySchema = listRestaurantsSchema.omit({
  limit: true,
  offset: true,
});

export const restaurantMapSchema = z.object({
  data: z.array(restaurantMapPinSchema),
  total: z.number().int().nonnegative(),
  /** True when the cap was hit, so the UI can say so instead of quietly lying. */
  truncated: z.boolean(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdminMapPin = z.infer<typeof adminMapPinSchema>;
export type UserDensityCell = z.infer<typeof userDensityCellSchema>;
export type AdminMap = z.infer<typeof adminMapSchema>;
export type RestaurantMapPin = z.infer<typeof restaurantMapPinSchema>;
export type ListRestaurantMapQuery = z.infer<typeof listRestaurantMapQuerySchema>;
export type RestaurantMap = z.infer<typeof restaurantMapSchema>;
