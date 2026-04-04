import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { mealChoice } from './order.js';
import { user } from './auth.js';

/**
 * Stores user feedback for a meal choice after it has been selected.
 */
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealChoiceId: uuid('meal_choice_id')
    .notNull()
    .references(() => mealChoice.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  rating: integer('rating'),
  liked: boolean('liked'),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
