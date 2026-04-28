import { sql } from 'drizzle-orm';
import {
  date,
  decimal,
  index,
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
 * Represents a single generation of meal suggestions for a specific budget plan.
 * Allows multiple independent generations to coexist without altering the original plan.
 *
 * Lifecycle:
 *  - inserted with status='pending' before the LLM call
 *  - flipped to 'succeeded' atomically with the suggestion insert
 *  - flipped to 'failed' (with errorCode/errorMessage) on LLM/parse/validation error
 *  - flipped to 'superseded' when a newer kickoff arrives for the same plan
 *
 * NOTE: a process crash mid-LLM-call leaves a 'pending' row that won't self-heal
 * in v1 — acceptable; the FE can fall back to "no recent activity" after a polling
 * timeout. A janitor that ages-out stuck pending rows can be added later.
 */
export const mealPlanGeneration = pgTable(
  'meal_plan_generation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    budgetPlanId: uuid('budget_plan_id')
      .notNull()
      .references(() => budgetPlan.id, { onDelete: 'cascade' }),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    status: text('status', { enum: ['pending', 'succeeded', 'failed', 'superseded'] })
      .notNull()
      .default('pending'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    // Partial index keeps the supersede UPDATE cheap as the table grows.
    index('meal_plan_generation_pending_idx')
      .on(table.budgetPlanId)
      .where(sql`${table.status} = 'pending'`),
  ],
);

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
