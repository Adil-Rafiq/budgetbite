import { boolean, date, decimal, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { budgetPlan } from './budget-plan.js';
import { mealSuggestion } from './meal-plan.js';
import { mealType } from './meal-type.js';
import { menuItem } from './menu-item.js';
import { restaurant } from './restaurant.js';
import { user } from './auth.js';

export const mealChoice = pgTable('meal_choice', {
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
  suggestionId: uuid('suggestion_id').references(() => mealSuggestion.id, {
    onDelete: 'set null',
  }),
  // Optional structured links to the actual restaurant/menu item the user
  // ordered. Nullable because pre-existing rows and free-form "manual" entries
  // may not have these. restaurantName remains as a denormalized snapshot
  // (menu items get re-scraped; the human-readable label should not drift).
  restaurantId: uuid('restaurant_id').references(() => restaurant.id, {
    onDelete: 'set null',
  }),
  menuItemId: uuid('menu_item_id').references(() => menuItem.id, {
    onDelete: 'set null',
  }),
  manualDescription: text('manual_description'),
  // A meal the user cooked at home rather than ordered out. Mutually exclusive
  // with a restaurant/menu-item link: home-cooked rows carry no suggestionId,
  // restaurantId, menuItemId, or restaurantName — only a user-entered amount and
  // an optional dish name in manualDescription. Kept as an explicit flag (rather
  // than inferred from null restaurant fields) so display/analytics can tell a
  // home-cooked meal apart from a manual restaurant entry.
  isHomeCooked: boolean('is_home_cooked').notNull().default(false),
  actualAmountSpent: decimal('actual_amount_spent', { precision: 10, scale: 2 }).notNull(),
  restaurantName: text('restaurant_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
