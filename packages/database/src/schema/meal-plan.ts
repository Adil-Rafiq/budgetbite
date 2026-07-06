import { sql } from 'drizzle-orm';
import {
  date,
  decimal,
  index,
  integer,
  jsonb,
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

/**
 * One suggested *order* for a slot: a single restaurant plus 1..N menu items
 * (see mealSuggestionItem). estimatedPrice is the combined cost of all items
 * in the order — per-item prices live on the item rows.
 */
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

/**
 * One rejected option snapshot inside a reroll event. Denormalized (names and
 * label are copied at reroll time) because the suggestion rows it describes
 * are deleted in the same transaction — this is the only surviving record of
 * what the user said "none of these" to.
 */
export interface RejectedSlotOption {
  restaurantId: string;
  restaurantName: string;
  /** Combined combo label, e.g. "Zinger Burger + Fries". */
  itemsLabel: string;
  menuItemIds: string[];
}

/**
 * One single-slot reroll event: the user asked for 3 fresh options for a
 * (slotDate, mealType) cell and implicitly rejected the options it had.
 *
 * Serves two purposes:
 *  - guard rail: COUNT(*) per (generationId, slotDate, mealTypeId) caps how
 *    many times one slot can be rerolled per generation (each row is a paid
 *    LLM call);
 *  - feedback: rejectedOptions accumulate across rerolls of the same slot and
 *    are replayed to the model as "do not suggest these again".
 */
export const mealSlotReroll = pgTable(
  'meal_slot_reroll',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    budgetPlanId: uuid('budget_plan_id')
      .notNull()
      .references(() => budgetPlan.id, { onDelete: 'cascade' }),
    generationId: uuid('generation_id')
      .notNull()
      .references(() => mealPlanGeneration.id, { onDelete: 'cascade' }),
    slotDate: date('slot_date', { mode: 'string' }).notNull(),
    mealTypeId: uuid('meal_type_id')
      .notNull()
      .references(() => mealType.id, { onDelete: 'restrict' }),
    rejectedOptions: jsonb('rejected_options').$type<RejectedSlotOption[]>().default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('meal_slot_reroll_slot_idx').on(table.generationId, table.slotDate, table.mealTypeId),
  ],
);

/**
 * A menu item inside a suggested order. A suggestion holds one or more of
 * these (burger + wings + drink for a single lunch); all items belong to the
 * suggestion's restaurant. itemIndex preserves the order the AI listed them.
 */
export const mealSuggestionItem = pgTable(
  'meal_suggestion_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    suggestionId: uuid('suggestion_id')
      .notNull()
      .references(() => mealSuggestion.id, { onDelete: 'cascade' }),
    itemIndex: integer('item_index').notNull(),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItem.id, { onDelete: 'cascade' }),
    estimatedPrice: decimal('estimated_price', { precision: 10, scale: 2 }),
  },
  (table) => [
    uniqueIndex('unique_suggestion_item_index').on(table.suggestionId, table.itemIndex),
    check('valid_item_index', sql`${table.itemIndex} >= 0`),
  ],
);
