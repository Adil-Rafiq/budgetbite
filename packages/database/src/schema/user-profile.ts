import { pgTable, doublePrecision, uuid, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { timestamps } from './common/timestamps.js';

export const userProfile = pgTable('user_profile', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),

  /**
   * User-declared dietary preferences from profile/onboarding.
   * e.g. ["halal", "vegetarian", "no beef"]
   * Distinct from user_preferences.dietaryNotes, which the AI infers from feedback.
   */
  dietaryPreferences: jsonb('dietary_preferences').$type<string[]>().default([]).notNull(),

  /**
   * User-declared allergens. Treated as hard constraints in the AI prompt.
   * e.g. ["peanuts", "shellfish"]
   */
  allergens: jsonb('allergens').$type<string[]>().default([]).notNull(),
  ...timestamps,
});
