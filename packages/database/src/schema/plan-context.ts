import { pgTable, uuid, decimal, integer, timestamp } from 'drizzle-orm/pg-core';
import { budgetPlan } from './budget-plan.js';

/**
 * Tracks the running budget state for an active plan.
 * Updated every time a mealChoice is confirmed.
 * Your backend computes all arithmetic here — the LLM only reads these values.
 */
export const planContext = pgTable('plan_context', {
  budgetPlanId: uuid('budget_plan_id')
    .primaryKey()
    .references(() => budgetPlan.id, { onDelete: 'cascade' }),

  /** Total budget as set in the plan (mirrors budgetPlan.totalBudget for denormaliz ed reads) */
  totalBudget: decimal('total_budget', { precision: 12, scale: 2 }).notNull(),

  /** Sum of all actualAmountSpent across all mealChoices for this plan */
  amountSpent: decimal('amount_spent', { precision: 12, scale: 2 }).default('0').notNull(),

  /** totalBudget - amountSpent */
  amountRemaining: decimal('amount_remaining', { precision: 12, scale: 2 }).notNull(),

  /** Total meals in the plan period (days × mealsPerDay) */
  totalMeals: integer('total_meals').notNull(),

  /** How many mealChoices have been confirmed so far */
  mealsConsumed: integer('meals_consumed').default(0).notNull(),

  /** totalMeals - mealsConsumed */
  mealsRemaining: integer('meals_remaining').notNull(),

  /**
   * Average budget per remaining meal (amountRemaining / mealsRemaining).
   * Recomputed on every mealChoice confirmation.
   * The LLM uses this to calibrate suggestion price ranges.
   */
  avgBudgetPerRemainingMeal: decimal('avg_budget_per_remaining_meal', {
    precision: 10,
    scale: 2,
  }).notNull(),

  /**
   * Cumulative variance from the original daily budget target.
   * Positive = underspent (budget headroom), Negative = overspent.
   */
  cumulativeVariance: decimal('cumulative_variance', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
