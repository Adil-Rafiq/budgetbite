import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

import { db } from "../db.js";
import { mealChoices, type MealChoice, type NewMealChoice } from "../schema/index.js";

export const orderRepository = {
  async findById(id: string): Promise<MealChoice | undefined> {
    const [row] = await db.select().from(mealChoices).where(eq(mealChoices.id, id)).limit(1);
    return row;
  },

  async listByUserAndPlan(userId: string, budgetPlanId: string, limit = 100): Promise<MealChoice[]> {
    return db
      .select()
      .from(mealChoices)
      .where(and(eq(mealChoices.userId, userId), eq(mealChoices.budgetPlanId, budgetPlanId)))
      .orderBy(desc(mealChoices.slotDate), desc(mealChoices.createdAt))
      .limit(limit);
  },

  async listByUserInDateRange(userId: string, startDate: string, endDate: string): Promise<MealChoice[]> {
    return db
      .select()
      .from(mealChoices)
      .where(and(eq(mealChoices.userId, userId), gte(mealChoices.slotDate, startDate), lte(mealChoices.slotDate, endDate)))
      .orderBy(desc(mealChoices.slotDate), desc(mealChoices.createdAt));
  },

  async getSpentTotalByPlan(budgetPlanId: string): Promise<string> {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${mealChoices.actualAmountSpent}::numeric), 0)`,
      })
      .from(mealChoices)
      .where(eq(mealChoices.budgetPlanId, budgetPlanId));
    return row?.total ?? "0";
  },

  async create(data: NewMealChoice): Promise<MealChoice> {
    const [inserted] = await db.insert(mealChoices).values(data).returning();
    if (!inserted) throw new Error("MealChoice insert failed");
    return inserted;
  },
};
