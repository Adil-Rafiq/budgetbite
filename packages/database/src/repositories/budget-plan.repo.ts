import { eq, and, desc } from "drizzle-orm";

import { db } from "../db";
import { budgetPlans, budgetPlanMealTypes, type BudgetPlan, type NewBudgetPlan, type NewBudgetPlanMealType } from "../schema/index";

export const budgetPlanRepository = {
  async findById(id: string): Promise<BudgetPlan | undefined> {
    const [row] = await db.select().from(budgetPlans).where(eq(budgetPlans.id, id)).limit(1);
    return row;
  },

  async findActiveByUserId(userId: string): Promise<BudgetPlan | undefined> {
    const [row] = await db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.userId, userId), eq(budgetPlans.status, "active")))
      .orderBy(desc(budgetPlans.startDate))
      .limit(1);
    return row;
  },

  async listByUserId(userId: string, limit = 20): Promise<BudgetPlan[]> {
    return db.select().from(budgetPlans).where(eq(budgetPlans.userId, userId)).orderBy(desc(budgetPlans.startDate)).limit(limit);
  },

  async create(data: NewBudgetPlan, mealTypeIds?: string[]): Promise<BudgetPlan> {
    const [inserted] = await db.insert(budgetPlans).values(data).returning();
    if (!inserted) throw new Error("BudgetPlan insert failed");
    if (mealTypeIds?.length) {
      const links: NewBudgetPlanMealType[] = mealTypeIds.map((mealTypeId, i) => ({
        budgetPlanId: inserted.id,
        mealTypeId,
        position: i,
      }));
      await db.insert(budgetPlanMealTypes).values(links);
    }
    return inserted;
  },

  async update(id: string, data: Partial<NewBudgetPlan>): Promise<BudgetPlan> {
    const [updated] = await db.update(budgetPlans).set(data).where(eq(budgetPlans.id, id)).returning();
    if (!updated) throw new Error("BudgetPlan not found");
    return updated;
  },

  async getMealTypeIds(budgetPlanId: string): Promise<string[]> {
    const rows = await db
      .select({ mealTypeId: budgetPlanMealTypes.mealTypeId })
      .from(budgetPlanMealTypes)
      .where(eq(budgetPlanMealTypes.budgetPlanId, budgetPlanId))
      .orderBy(budgetPlanMealTypes.position);
    return rows.map((r) => r.mealTypeId);
  },
};
