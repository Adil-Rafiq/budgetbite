import { sql } from 'drizzle-orm';
import {
  date,
  decimal,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  check,
  text,
  uuid,
} from 'drizzle-orm/pg-core';

import { budgetPlan } from './budget-plan.js';
import { mealType } from './meal-type.js';
import { menuItem } from './menu-item.js';
import { restaurant } from './restaurant.js';

/**
 * Tracks a single meal plan generation for a budget plan.
 * Enables multiple independent suggestion sets without modifying the original budget plan.
 */
export const mealPlanGeneration = pgTable('meal_plan_generation', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetPlanId: uuid('budget_plan_id')
    .notNull()
    .references(() => budgetPlan.id, { onDelete: 'cascade' }),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mealSuggestion = pgTable(
  'meal_suggestion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generationId: uuid('generation_id')
      .notNull()
      .references(() => mealPlanGeneration.id, { onDelete: 'cascade' }),
    slotDate: date('slot_date', { mode: 'string' }).notNull(),
    mealTypeId: uuid('meal_type_id')
      .notNull()
      .references(() => mealType.id, { onDelete: 'restrict' }),
    optionIndex: integer('option_index').notNull(), // more the once choice for a single meal
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItem.id, { onDelete: 'cascade' }),
    estimatedPrice: decimal('estimated_price', { precision: 10, scale: 2 }),
    notes: text('notes'),
  },
  (table) => [
    uniqueIndex('unique_generation_slot').on(
      table.generationId,
      table.slotDate,
      table.mealTypeId,
      table.optionIndex,
    ),
    check('valid_option_index', sql`${table.optionIndex} >= 0`),
  ],
);
