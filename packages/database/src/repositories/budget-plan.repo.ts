import { eq, and, desc } from 'drizzle-orm';

import { db } from '../db.js';
import {
  budgetPlan,
  budgetPlanMealType,
  mealType,
  type BudgetPlan,
  type NewBudgetPlan,
  type NewBudgetPlanMealType,
} from '../schema/index.js';

export const budgetPlanRepository = {
  async findById(id: string): Promise<BudgetPlan | undefined> {
    const [row] = await db.select().from(budgetPlan).where(eq(budgetPlan.id, id)).limit(1);
    return row;
  },

  async findActiveByUserId(userId: string): Promise<BudgetPlan | undefined> {
    const [row] = await db
      .select()
      .from(budgetPlan)
      .where(and(eq(budgetPlan.userId, userId), eq(budgetPlan.status, 'active')))
      .orderBy(desc(budgetPlan.startDate))
      .limit(1);
    return row;
  },

  async listByUserId(userId: string, limit = 20): Promise<BudgetPlan[]> {
    return db
      .select()
      .from(budgetPlan)
      .where(eq(budgetPlan.userId, userId))
      .orderBy(desc(budgetPlan.startDate))
      .limit(limit);
  },

  async create(data: NewBudgetPlan, mealTypeIds?: string[]): Promise<BudgetPlan> {
    const [inserted] = await db.insert(budgetPlan).values(data).returning();
    if (!inserted) throw new Error('BudgetPlan insert failed');
    if (mealTypeIds?.length) {
      const links: NewBudgetPlanMealType[] = mealTypeIds.map((mealTypeId, i) => ({
        budgetPlanId: inserted.id,
        mealTypeId,
        position: i,
      }));
      await db.insert(budgetPlanMealType).values(links);
    }
    return inserted;
  },

  async update(id: string, data: Partial<NewBudgetPlan>): Promise<BudgetPlan> {
    const [updated] = await db
      .update(budgetPlan)
      .set(data)
      .where(eq(budgetPlan.id, id))
      .returning();
    if (!updated) throw new Error('BudgetPlan not found');
    return updated;
  },

  async getMealTypeIds(budgetPlanId: string): Promise<string[]> {
    const rows = await db
      .select({ mealTypeId: budgetPlanMealType.mealTypeId })
      .from(budgetPlanMealType)
      .where(eq(budgetPlanMealType.budgetPlanId, budgetPlanId))
      .orderBy(budgetPlanMealType.position);
    return rows.map((r) => r.mealTypeId);
  },

  // ─── AI method ─────────────────────────────────────────────────────────────

  /**
   * Get meal types for a plan with full details (key, label, sortOrder).
   * Used by ContextBuilderService to populate PlanMetaContext.mealTypes.
   */
  async getMealTypesWithDetails(
    budgetPlanId: string,
  ): Promise<{ key: string; label: string; sortOrder: number }[]> {
    const rows = await db
      .select({
        key: mealType.key,
        label: mealType.label,
        sortOrder: mealType.sortOrder,
      })
      .from(budgetPlanMealType)
      .innerJoin(mealType, eq(budgetPlanMealType.mealTypeId, mealType.id))
      .where(eq(budgetPlanMealType.budgetPlanId, budgetPlanId))
      .orderBy(budgetPlanMealType.position);
    return rows;
  },
};
