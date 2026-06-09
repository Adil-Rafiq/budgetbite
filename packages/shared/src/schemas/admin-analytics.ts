import { z } from 'zod';

import { uuidSchema } from './common.js';

// ─── Data quality ─────────────────────────────────────────────────────────────

export const dataQualityEntitySchema = z.object({
  id: uuidSchema,
  name: z.string(),
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
