import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { mealChoices } from './orders.js';
import { user } from './auth.js';

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealChoiceId: uuid('meal_choice_id')
    .notNull()
    .references(() => mealChoices.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  rating: integer('rating'),
  liked: boolean('liked'),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
