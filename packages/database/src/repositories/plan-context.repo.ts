import { eq, sql } from 'drizzle-orm';

import { db, type DbOrTx } from '../db.js';
import {
  planContext,
  type PlanContext,
  type NewPlanContext,
  type UpdatePlanContext,
} from '../schema/index.js';

/**
 * Atomic delta applied when a meal_choice is confirmed. The SQL is expressed
 * as read-modify-write against the current row so two concurrent choices cannot
 * race each other into a wrong amountSpent.
 */
export type PlanContextChoiceDelta = {
  /** Amount the user actually spent on this meal (positive number). */
  spentAmount: number;
  /** Fixed budget allocated per meal (totalBudget / totalMeals, pre-computed by caller). */
  plannedMealBudget: number;
};

export const planContextRepository = {
  async findByPlanId(budgetPlanId: string, tx?: DbOrTx): Promise<PlanContext | undefined> {
    const exec = tx ?? db;
    const [row] = await exec
      .select()
      .from(planContext)
      .where(eq(planContext.budgetPlanId, budgetPlanId))
      .limit(1);
    return row;
  },

  async create(data: NewPlanContext, tx?: DbOrTx): Promise<PlanContext> {
    const exec = tx ?? db;
    const [inserted] = await exec
      .insert(planContext)
      .values(data)
      .onConflictDoNothing()
      .returning();
    if (!inserted) throw new Error('PlanContext insert failed');
    return inserted;
  },

  async update(budgetPlanId: string, data: UpdatePlanContext, tx?: DbOrTx): Promise<PlanContext> {
    const exec = tx ?? db;
    const [updated] = await exec
      .update(planContext)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planContext.budgetPlanId, budgetPlanId))
      .returning();
    if (!updated) throw new Error('PlanContext not found');
    return updated;
  },

  /**
   * Apply a meal-choice delta atomically: one UPDATE that reads the current
   * numeric columns via SQL expressions and writes the new values. Keeps
   * amountSpent / mealsConsumed consistent under concurrent confirmations.
   *
   * Caller supplies the pre-computed `plannedMealBudget` (totalBudget / totalMeals)
   * so the arithmetic below stays pure SQL — no JS round-trips.
   */
  async updateForChoice(
    budgetPlanId: string,
    delta: PlanContextChoiceDelta,
    tx?: DbOrTx,
  ): Promise<PlanContext> {
    const exec = tx ?? db;
    const spent = delta.spentAmount.toString();
    const planned = delta.plannedMealBudget.toString();

    const [updated] = await exec
      .update(planContext)
      .set({
        amountSpent: sql`${planContext.amountSpent} + ${spent}::numeric`,
        amountRemaining: sql`${planContext.amountRemaining} - ${spent}::numeric`,
        mealsConsumed: sql`${planContext.mealsConsumed} + 1`,
        mealsRemaining: sql`${planContext.mealsRemaining} - 1`,
        avgBudgetPerRemainingMeal: sql`CASE
          WHEN ${planContext.mealsRemaining} - 1 > 0
          THEN (${planContext.amountRemaining} - ${spent}::numeric) / (${planContext.mealsRemaining} - 1)
          ELSE 0
        END`,
        cumulativeVariance: sql`${planContext.cumulativeVariance} + (${planned}::numeric - ${spent}::numeric)`,
        updatedAt: new Date(),
      })
      .where(eq(planContext.budgetPlanId, budgetPlanId))
      .returning();

    if (!updated) throw new Error('PlanContext not found');
    return updated;
  },
};
