import { sql } from "drizzle-orm";
import { pgTable, uuid, check, decimal, integer, text, date, jsonb } from "drizzle-orm/pg-core";

import { timestamps } from "./common/timestamps";
import { users } from "./users";

export const budgetPlans = pgTable(
  "budget_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planType: text("plan_type", { enum: ["weekly", "monthly"] }).notNull(),
    totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    mealsPerDay: integer("meals_per_day").notNull(),
    mealTypes: jsonb("meal_types").$type<string[]>().notNull(),
    notificationTimes: jsonb("notification_times").$type<string[]>(),
    status: text("status", { enum: ["active", "completed", "cancelled"] })
      .notNull()
      .default("active"),

    ...timestamps,
  },
  (table) => [
    // mealTypes length must equal mealsPerDay
    check("budget_plans_meal_types_length", sql`jsonb_array_length(${table.mealTypes}) = ${table.mealsPerDay}`),
    // when notificationTimes is provided, its length must equal mealsPerDay
    check(
      "budget_plans_notification_times_length",
      sql`(${table.notificationTimes} IS NULL OR jsonb_array_length(${table.notificationTimes}) = ${table.mealsPerDay})`,
    ),
  ],
);
