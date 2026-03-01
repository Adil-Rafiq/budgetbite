import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

import { db } from '../db.js';
import { mealChoice, type MealChoice, type NewMealChoice } from '../schema/index.js';

export const orderRepository = {
  async findById(id: string): Promise<MealChoice | undefined> {
    const [row] = await db.select().from(mealChoice).where(eq(mealChoice.id, id)).limit(1);
    return row;
  },

  async listByUserAndPlan(
    userId: string,
    budgetPlanId: string,
    limit = 100,
  ): Promise<MealChoice[]> {
    return db
      .select()
      .from(mealChoice)
      .where(and(eq(mealChoice.userId, userId), eq(mealChoice.budgetPlanId, budgetPlanId)))
      .orderBy(desc(mealChoice.slotDate), desc(mealChoice.createdAt))
      .limit(limit);
  },

  async listByUserInDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<MealChoice[]> {
    return db
      .select()
      .from(mealChoice)
      .where(
        and(
          eq(mealChoice.userId, userId),
          gte(mealChoice.slotDate, startDate),
          lte(mealChoice.slotDate, endDate),
        ),
      )
      .orderBy(desc(mealChoice.slotDate), desc(mealChoice.createdAt));
  },

  async getSpentTotalByPlan(budgetPlanId: string): Promise<string> {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${mealChoice.actualAmountSpent}::numeric), 0)`,
      })
      .from(mealChoice)
      .where(eq(mealChoice.budgetPlanId, budgetPlanId));
    return row?.total ?? '0';
  },

  async create(data: NewMealChoice): Promise<MealChoice> {
    const [inserted] = await db.insert(mealChoice).values(data).returning();
    if (!inserted) throw new Error('MealChoice insert failed');
    return inserted;
  },
};
