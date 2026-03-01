import { date, decimal, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { budgetPlans } from './budget-plans.js';
import { mealSuggestions } from './meal-plans.js';
import { mealTypes } from './meal-types.js';
import { user } from './auth.js';

export const mealChoices = pgTable('meal_choices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  budgetPlanId: uuid('budget_plan_id')
    .notNull()
    .references(() => budgetPlans.id, { onDelete: 'cascade' }),
  slotDate: date('slot_date', { mode: 'string' }).notNull(),
  mealTypeId: uuid('meal_type_id')
    .notNull()
    .references(() => mealTypes.id, { onDelete: 'restrict' }),
  suggestionId: uuid('suggestion_id').references(() => mealSuggestions.id, {
    onDelete: 'set null',
  }),
  manualDescription: text('manual_description'),
  actualAmountSpent: decimal('actual_amount_spent', { precision: 10, scale: 2 }).notNull(),
  restaurantName: text('restaurant_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
