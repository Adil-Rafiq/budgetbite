import { date, decimal, index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { budgetPlan } from './budget-plan.js';
import { mealType } from './meal-type.js';
import { menuItem } from './menu-item.js';
import { restaurant } from './restaurant.js';
import { user } from './auth.js';

/**
 * A user-pinned commitment for a future meal slot. Pins live outside of the
 * meal_plan_generation lifecycle so they survive replans — when the AI
 * replans, pinned (slotDate, mealTypeId) pairs are excluded from generation
 * and their priceAtPin is subtracted from amountRemaining/mealsRemaining
 * before the per-meal target is recomputed.
 *
 * Lifecycle:
 *   - upsert via POST /meal-pins (one pin per (planId, slotDate, mealTypeId))
 *   - explicit DELETE /meal-pins/:id
 *   - implicit delete inside mealChoiceService.recordChoice when a choice
 *     lands on the same slot (the choice supersedes the pin).
 *
 * priceAtPin is a snapshot of menuItem.price at pin-create time. menuItem.price
 * mutates on rescrape; the pin's budget-math contribution must not drift.
 */
export const mealPin = pgTable(
  'meal_pin',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    budgetPlanId: uuid('budget_plan_id')
      .notNull()
      .references(() => budgetPlan.id, { onDelete: 'cascade' }),
    slotDate: date('slot_date', { mode: 'string' }).notNull(),
    mealTypeId: uuid('meal_type_id')
      .notNull()
      .references(() => mealType.id, { onDelete: 'restrict' }),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItem.id, { onDelete: 'cascade' }),
    priceAtPin: decimal('price_at_pin', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_pin_slot').on(table.budgetPlanId, table.slotDate, table.mealTypeId),
    index('meal_pin_plan_date_idx').on(table.budgetPlanId, table.slotDate),
  ],
);
