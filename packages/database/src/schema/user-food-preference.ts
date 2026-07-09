import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { menuItem } from './menu-item.js';
import { restaurant } from './restaurant.js';
import { user } from './auth.js';

/**
 * Persistent, user-managed favorites & block list. One row per (user, target),
 * where a target is EITHER a restaurant OR a menu item — exactly one of
 * restaurantId / menuItemId is set (enforced by the check constraint below).
 *
 * How it feeds the planner (see context-builder.service.ts):
 *   - sentiment 'blocked' restaurants are unioned with the AI-learned
 *     `user_preferences.dislikedRestaurantIds` and filtered OUT before the LLM
 *     sees the restaurant list (hard exclusion).
 *   - sentiment 'blocked' menu items are filtered OUT of each restaurant's menu.
 *   - sentiment 'favorite' restaurants / items are flagged (`isFavorite`) on the
 *     nearby context so the prompt can bias toward them (soft preference, not a
 *     hard constraint — favorites can't cover every slot/budget).
 *
 * Unlike `meal_pin` (a per-plan slot commitment) these live at the user level
 * and persist across plans.
 */
export const userFoodPreference = pgTable(
  'user_food_preference',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id').references(() => restaurant.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id').references(() => menuItem.id, { onDelete: 'cascade' }),
    sentiment: text('sentiment', { enum: ['favorite', 'blocked'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // One preference per (user, restaurant) and per (user, menu item). Partial
    // indexes so the NULL column of the other target type never collides.
    uniqueIndex('ufp_user_restaurant_idx')
      .on(table.userId, table.restaurantId)
      .where(sql`${table.restaurantId} IS NOT NULL`),
    uniqueIndex('ufp_user_menu_item_idx')
      .on(table.userId, table.menuItemId)
      .where(sql`${table.menuItemId} IS NOT NULL`),
    index('ufp_user_idx').on(table.userId),
    // Exactly one target set — a row is a restaurant preference xor an item one.
    check(
      'ufp_exactly_one_target',
      sql`(${table.restaurantId} IS NOT NULL)::int + (${table.menuItemId} IS NOT NULL)::int = 1`,
    ),
  ],
);
