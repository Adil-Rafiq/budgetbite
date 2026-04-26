import { z } from 'zod';

import { uuidSchema } from './common.js';

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const mealTypeSchema = z.object({
  id: uuidSchema,
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Compact shape used when a meal type is embedded inside another resource (e.g. a budget plan). */
export const mealTypeSummarySchema = mealTypeSchema.pick({
  id: true,
  key: true,
  label: true,
  sortOrder: true,
});

// ─── Admin inputs ───────────────────────────────────────────────────────────

export const createMealTypeSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'key must be lowercase letters, numbers, hyphen or underscore'),
  label: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const updateMealTypeSchema = createMealTypeSchema.partial();

// ─── Types ──────────────────────────────────────────────────────────────────

export type MealType = z.infer<typeof mealTypeSchema>;
export type MealTypeSummary = z.infer<typeof mealTypeSummarySchema>;
export type CreateMealTypeInput = z.infer<typeof createMealTypeSchema>;
export type UpdateMealTypeInput = z.infer<typeof updateMealTypeSchema>;
