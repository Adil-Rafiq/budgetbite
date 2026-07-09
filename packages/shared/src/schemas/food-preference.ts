import { z } from 'zod';

import { uuidSchema } from './common.js';

/**
 * Persistent favorites & block list. A preference targets EITHER a restaurant
 * or a menu item (`targetType`), and is EITHER a favorite (soft bias) or blocked
 * (hard exclusion) (`sentiment`). See `user_food_preference` in the DB.
 */

export const foodPreferenceTargetTypeSchema = z.enum(['restaurant', 'menu_item']);
export const foodPreferenceSentimentSchema = z.enum(['favorite', 'blocked']);

// ─── Inputs ─────────────────────────────────────────────────────────────────

/** Upsert (create or flip sentiment of) a preference. `POST /api/food-preferences`. */
export const upsertFoodPreferenceSchema = z.object({
  targetType: foodPreferenceTargetTypeSchema,
  targetId: uuidSchema,
  sentiment: foodPreferenceSentimentSchema,
});

/** Remove a preference by target. `DELETE /api/food-preferences`. */
export const deleteFoodPreferenceSchema = z.object({
  targetType: foodPreferenceTargetTypeSchema,
  targetId: uuidSchema,
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const foodPreferenceResponseSchema = z.object({
  id: uuidSchema,
  targetType: foodPreferenceTargetTypeSchema,
  targetId: uuidSchema,
  sentiment: foodPreferenceSentimentSchema,
  /** Display name of the restaurant or menu item. */
  name: z.string(),
  /** For a menu-item target, its parent restaurant's id/name; null for a restaurant target. */
  restaurantId: uuidSchema.nullable(),
  restaurantName: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const listFoodPreferencesResponseSchema = z.array(foodPreferenceResponseSchema);

// ─── Types ──────────────────────────────────────────────────────────────────

export type FoodPreferenceTargetType = z.infer<typeof foodPreferenceTargetTypeSchema>;
export type FoodPreferenceSentimentValue = z.infer<typeof foodPreferenceSentimentSchema>;
export type UpsertFoodPreferenceInput = z.infer<typeof upsertFoodPreferenceSchema>;
export type DeleteFoodPreferenceInput = z.infer<typeof deleteFoodPreferenceSchema>;
export type FoodPreferenceResponse = z.infer<typeof foodPreferenceResponseSchema>;
export type ListFoodPreferencesResponse = z.infer<typeof listFoodPreferencesResponseSchema>;
