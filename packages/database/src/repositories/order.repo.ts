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

  // ─── AI methods ────────────────────────────────────────────────────────────

  /**
   * Count how many meal choices have been confirmed for a plan.
   * Used by BudgetService to recompute mealsConsumed accurately from DB.
   */
  async getConsumedCount(budgetPlanId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mealChoice)
      .where(eq(mealChoice.budgetPlanId, budgetPlanId));
    return row?.count ?? 0;
  },

  /**
   * Get the set of slotDates that already have a confirmed choice,
   * from today onwards. Used by ContextBuilderService to compute remainingDates.
   */
  async getConfirmedDatesFromToday(budgetPlanId: string): Promise<Set<string>> {
    const today = new Date().toISOString().split('T')[0]!;
    const rows = await db
      .selectDistinct({ slotDate: mealChoice.slotDate })
      .from(mealChoice)
      .where(and(eq(mealChoice.budgetPlanId, budgetPlanId), gte(mealChoice.slotDate, today)));
    return new Set(rows.map((r) => r.slotDate));
  },

  /**
   * Get a single choice with its mealType label.
   * Used by MealPlannerService to build the trigger summary for replanning.
   */
  async findByIdWithMealType(
    id: string,
  ): Promise<(MealChoice & { mealTypeLabel: string }) | undefined> {
    const row = await db.query.mealChoice.findFirst({
      where: (mc, { eq }) => eq(mc.id, id),
      columns: {
        id: true,
        userId: true,
        budgetPlanId: true,
        slotDate: true,
        mealTypeId: true,
        suggestionId: true,
        manualDescription: true,
        actualAmountSpent: true,
        restaurantName: true,
        createdAt: true,
      },
      with: {
        mealType: {
          columns: {
            label: true,
          },
        },
      },
    });

    if (!row) return undefined;

    return {
      id: row.id,
      userId: row.userId,
      budgetPlanId: row.budgetPlanId,
      slotDate: row.slotDate,
      mealTypeId: row.mealTypeId,
      suggestionId: row.suggestionId,
      manualDescription: row.manualDescription,
      actualAmountSpent: row.actualAmountSpent,
      restaurantName: row.restaurantName,
      createdAt: row.createdAt,
      mealTypeLabel: row.mealType.label,
    };
  },
};
