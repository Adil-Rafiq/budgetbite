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

// ─── Types ──────────────────────────────────────────────────────────────────

export type DataQualityGroup = z.infer<typeof dataQualityGroupSchema>;
export type DataQuality = z.infer<typeof dataQualitySchema>;
