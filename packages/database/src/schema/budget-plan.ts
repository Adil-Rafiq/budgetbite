import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  check,
  decimal,
  integer,
  text,
  date,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { timestamps } from './common/timestamps.js';
import { user } from './auth.js';

/**
 * Defines a user's meal budgeting plan over a fixed period.
 * Acts as the base configuration for generating meal suggestions.
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
    // Enforces "one active plan per user" at the DB level. Partial index so
    // cancelled/completed rows don't conflict. Backstops the service-level
    // SELECT FOR UPDATE precondition against any race that bypasses it.
    uniqueIndex('budget_plan_one_active_per_user_idx')
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
  ],
);
