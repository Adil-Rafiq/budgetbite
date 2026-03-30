import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.js';

/**
 * Persisted AI preference profile per user.
 * Updated after every feedback submission.
 * Injected into every LLM context call.
 */
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),

  /**
   * Restaurant IDs the user has explicitly disliked or marked as bad.
   * Pre-filtered OUT before the LLM sees the restaurant list.
   */
  dislikedRestaurantIds: jsonb('disliked_restaurant_ids').$type<string[]>().default([]).notNull(),

  /**
   * Free-form cuisine/food tags the user has positively signalled.
   * e.g. ["biryani", "desi", "fast food"]
   */
  preferredCuisineTags: jsonb('preferred_cuisine_tags').$type<string[]>().default([]).notNull(),

  /**
   * Free-form cuisine/food tags the user has negatively signalled.
   * e.g. ["chinese", "sushi"]
   */
  dislikedCuisineTags: jsonb('disliked_cuisine_tags').$type<string[]>().default([]).notNull(),

  /**
   * Dietary restrictions expressed by the user over time.
   * e.g. ["no beef", "vegetarian on Fridays"]
   */
  dietaryNotes: jsonb('dietary_notes').$type<string[]>().default([]).notNull(),

  /**
   * Rolling summary of the last N feedback entries for LLM context.
   * Stored as pre-formatted text to avoid re-querying feedback table on every LLM call.
   * Max ~2000 chars. Older entries get summarised and dropped.
   */
  feedbackSummary: text('feedback_summary'),

  /**
   * Price sensitivity inferred from choices: 'budget' | 'mid' | 'premium'
   */
  priceSensitivity: text('price_sensitivity', {
    enum: ['budget', 'mid', 'premium'],
  })
    .default('mid')
    .notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
