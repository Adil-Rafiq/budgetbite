import { eq } from 'drizzle-orm';

import { db } from '../db.js';
import {
  planContext,
  type PlanContext,
  type NewPlanContext,
  type UpdatePlanContext,
} from '../schema/index.js';

export const planContextRepository = {
  async findByPlanId(budgetPlanId: string): Promise<PlanContext | undefined> {
    const [row] = await db
      .select()
      .from(planContext)
      .where(eq(planContext.budgetPlanId, budgetPlanId))
      .limit(1);
    return row;
  },

  async create(data: NewPlanContext): Promise<PlanContext> {
    const [inserted] = await db.insert(planContext).values(data).onConflictDoNothing().returning();
    if (!inserted) throw new Error('PlanContext insert failed');
    return inserted;
  },

  async update(budgetPlanId: string, data: UpdatePlanContext): Promise<PlanContext> {
    const [updated] = await db
      .update(planContext)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planContext.budgetPlanId, budgetPlanId))
      .returning();
    if (!updated) throw new Error('PlanContext not found');
    return updated;
  },
};
