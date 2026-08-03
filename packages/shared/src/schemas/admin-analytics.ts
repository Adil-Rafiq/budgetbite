import { z } from 'zod';

import { uuidSchema } from './common.js';

// ─── Data quality ─────────────────────────────────────────────────────────────

export const dataQualityEntitySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  /**
   * The restaurant this entity belongs to, for groups whose entity is a menu
   * item rather than a restaurant.
   *
   * Without it, an invalid-price item was a dead end: the report named a dish,
   * the admin had no menu-item search to find it by, and restaurant search
   * matches on restaurant name only — so the one defect class that actually
   * corrupts a plan's arithmetic was the one with no route to a fix.
   *
   * Absent on restaurant-keyed groups, where `id` is already the restaurant.
   */
  restaurantId: uuidSchema.optional(),
  restaurantName: z.string().optional(),
});

export const dataQualityGroupSchema = z.object({
  count: z.number().int(),
  sample: z.array(dataQualityEntitySchema),
});

export const dataQualitySchema = z.object({
  staleDays: z.number().int(),
  restaurantsWithoutItems: dataQualityGroupSchema,
  restaurantsWithoutRating: dataQualityGroupSchema,
  staleRestaurants: dataQualityGroupSchema,
  itemsInvalidPrice: dataQualityGroupSchema,
});

// ─── Metrics ──────────────────────────────────────────────────────────────────

export const adminMetricsSchema = z.object({
  users: z.number().int(),
  admins: z.number().int(),
  restaurants: z.number().int(),
  menuItems: z.number().int(),
  activePlans: z.number().int(),
  totalGenerations: z.number().int(),
  signupsLast30Days: z.number().int(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type DataQualityGroup = z.infer<typeof dataQualityGroupSchema>;
export type DataQuality = z.infer<typeof dataQualitySchema>;
export type AdminMetrics = z.infer<typeof adminMetricsSchema>;
