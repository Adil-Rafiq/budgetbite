import { pgTable, uuid, text, integer, boolean } from "drizzle-orm/pg-core";

import { timestamps } from "./common/timestamps";

export const mealTypes = pgTable("meal_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),

  ...timestamps,
});

export type MealType = typeof mealTypes.$inferSelect;
export type NewMealType = typeof mealTypes.$inferInsert;
