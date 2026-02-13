import { sql } from "drizzle-orm";
import { date, decimal, integer, pgTable, timestamp, uniqueIndex, check, text, uuid } from "drizzle-orm/pg-core";

import { budgetPlans } from "./budget-plans";
import { mealTypes } from "./meal-types";
import { menuItems } from "./menu-items";
import { restaurants } from "./restaurants";

export const mealPlanGenerations = pgTable("meal_plan_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetPlanId: uuid("budget_plan_id")
    .notNull()
    .references(() => budgetPlans.id, { onDelete: "cascade" }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mealSuggestions = pgTable(
  "meal_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => mealPlanGenerations.id, { onDelete: "cascade" }),
    slotDate: date("slot_date", { mode: "string" }).notNull(),
    mealTypeId: uuid("meal_type_id")
      .notNull()
      .references(() => mealTypes.id, { onDelete: "restrict" }),
    optionIndex: integer("option_index").notNull(), // more the once choice for a single meal
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("unique_generation_slot").on(table.generationId, table.slotDate, table.mealTypeId, table.optionIndex),
    check("valid_option_index", sql`${table.optionIndex} >= 0`),
  ],
);

export type MealPlanGeneration = typeof mealPlanGenerations.$inferSelect;
export type NewMealPlanGeneration = typeof mealPlanGenerations.$inferInsert;
export type MealSuggestion = typeof mealSuggestions.$inferSelect;
export type NewMealSuggestion = typeof mealSuggestions.$inferInsert;
