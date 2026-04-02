import { sql } from 'drizzle-orm';
import { pgTable, uuid, check, decimal, integer, text, date, jsonb } from 'drizzle-orm/pg-core';

import { timestamps } from './common/timestamps.js';
import { user } from './auth.js';

/**
 * This table represents a user's budget plan for meals. It includes details about the type of plan (weekly or monthly),
 * the total budget allocated, the date range for the plan, the number of meals per day, and notification times.
 * The status column indicates whether the plan is active, completed, or cancelled.
 */
export const budgetPlan = pgTable(
  'budget_plan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    planType: text('plan_type', { enum: ['weekly', 'monthly'] }).notNull(),
    totalBudget: decimal('total_budget', { precision: 12, scale: 2 }).notNull(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    mealsPerDay: integer('meals_per_day').notNull(),
    notificationTimes: jsonb('notification_times').$type<string[]>(),
    status: text('status', { enum: ['active', 'completed', 'cancelled'] })
      .notNull()
      .default('active'),

    ...timestamps,
  },
  (table) => [
    check(
      'budget_plans_notification_times_length',
      sql`(${table.notificationTimes} IS NULL OR jsonb_array_length(${table.notificationTimes}) = ${table.mealsPerDay})`,
    ),
  ],
);
