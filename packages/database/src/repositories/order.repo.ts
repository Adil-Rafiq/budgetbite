import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

import { db, type DbOrTx } from '../db.js';
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

  /**
   * Whether a confirmed choice already exists for one (slotDate, mealType)
   * cell of a plan. Used by the slot reroll to block regenerating a meal the
   * user has already logged.
   */
  async hasChoiceForSlot(
    budgetPlanId: string,
    slotDate: string,
    mealTypeId: string,
  ): Promise<boolean> {
    const [row] = await db
      .select({ id: mealChoice.id })
      .from(mealChoice)
      .where(
        and(
          eq(mealChoice.budgetPlanId, budgetPlanId),
          eq(mealChoice.slotDate, slotDate),
          eq(mealChoice.mealTypeId, mealTypeId),
        ),
      )
      .limit(1);
    return !!row;
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

  async create(data: NewMealChoice, tx?: DbOrTx): Promise<MealChoice> {
    const exec = tx ?? db;
    const [inserted] = await exec.insert(mealChoice).values(data).returning();
    if (!inserted) throw new Error('MealChoice insert failed');
    return inserted;
  },

  async listByUserAndPlanWithPagination(
    userId: string,
    budgetPlanId: string,
    opts: { limit: number; offset: number },
  ): Promise<
    {
      id: string;
      budgetPlanId: string;
      slotDate: string;
      mealTypeId: string;
      suggestionId: string | null;
      restaurantId: string | null;
      menuItemId: string | null;
      manualDescription: string | null;
      actualAmountSpent: string;
      restaurantName: string | null;
      menuItemName: string | null;
      createdAt: Date;
    }[]
  > {
    const rows = await db.query.mealChoice.findMany({
      where: (mc, { eq, and }) => and(eq(mc.userId, userId), eq(mc.budgetPlanId, budgetPlanId)),
      orderBy: (mc, { desc }) => [desc(mc.slotDate), desc(mc.createdAt)],
      limit: opts.limit,
      offset: opts.offset,
      columns: {
        id: true,
        budgetPlanId: true,
        slotDate: true,
        mealTypeId: true,
        suggestionId: true,
        restaurantId: true,
        menuItemId: true,
        manualDescription: true,
        actualAmountSpent: true,
        restaurantName: true,
        createdAt: true,
      },
      with: {
        menuItem: {
          columns: { name: true },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      budgetPlanId: r.budgetPlanId,
      slotDate: r.slotDate,
      mealTypeId: r.mealTypeId,
      suggestionId: r.suggestionId,
      restaurantId: r.restaurantId,
      menuItemId: r.menuItemId,
      manualDescription: r.manualDescription,
      actualAmountSpent: r.actualAmountSpent,
      restaurantName: r.restaurantName,
      menuItemName: r.menuItem?.name ?? null,
      createdAt: r.createdAt,
    }));
  },

  async countByPlan(userId: string, budgetPlanId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mealChoice)
      .where(and(eq(mealChoice.userId, userId), eq(mealChoice.budgetPlanId, budgetPlanId)));
    return row?.count ?? 0;
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
   * Every confirmed choice on a plan, with the linked menu item's name and
   * the choice's own restaurantName snapshot (already on the row). Drives the
   * Plan Timeline read so each "logged" cell can render without an extra
   * round-trip per choice.
   */
  async listByPlanWithItem(
    userId: string,
    budgetPlanId: string,
  ): Promise<
    {
      id: string;
      slotDate: string;
      mealTypeId: string;
      suggestionId: string | null;
      restaurantId: string | null;
      menuItemId: string | null;
      manualDescription: string | null;
      actualAmountSpent: string;
      restaurantName: string | null;
      menuItemName: string | null;
    }[]
  > {
    const rows = await db.query.mealChoice.findMany({
      where: (mc, { eq, and }) => and(eq(mc.userId, userId), eq(mc.budgetPlanId, budgetPlanId)),
      columns: {
        id: true,
        slotDate: true,
        mealTypeId: true,
        suggestionId: true,
        restaurantId: true,
        menuItemId: true,
        manualDescription: true,
        actualAmountSpent: true,
        restaurantName: true,
      },
      with: {
        menuItem: {
          columns: { name: true },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      slotDate: r.slotDate,
      mealTypeId: r.mealTypeId,
      suggestionId: r.suggestionId,
      restaurantId: r.restaurantId,
      menuItemId: r.menuItemId,
      manualDescription: r.manualDescription,
      actualAmountSpent: r.actualAmountSpent,
      restaurantName: r.restaurantName,
      menuItemName: r.menuItem?.name ?? null,
    }));
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
        restaurantId: true,
        menuItemId: true,
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
      restaurantId: row.restaurantId,
      menuItemId: row.menuItemId,
      manualDescription: row.manualDescription,
      actualAmountSpent: row.actualAmountSpent,
      restaurantName: row.restaurantName,
      createdAt: row.createdAt,
      mealTypeLabel: row.mealType.label,
    };
  },
};
