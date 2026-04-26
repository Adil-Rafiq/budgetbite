import { eq, and, desc, asc, sql } from 'drizzle-orm';

import { db, type DbOrTx } from '../db.js';
import {
  budgetPlan,
  budgetPlanMealType,
  mealType,
  mealPlanGeneration,
  type BudgetPlan,
  type NewBudgetPlan,
  type UpdateBudgetPlan,
  type NewBudgetPlanMealType,
  type NewPlanContext,
  type MealType,
  planContext,
} from '../schema/index.js';

// ─── Relation-enriched row shapes ─────────────────────────────────────────────

export type PlanContextRelationRow = {
  totalBudget: string;
  amountSpent: string;
  amountRemaining: string;
  totalMeals: number;
  mealsConsumed: number;
  mealsRemaining: number;
  avgBudgetPerRemainingMeal: string;
  cumulativeVariance: string;
};

export type MealTypeOnPlanRow = Pick<MealType, 'id' | 'key' | 'label' | 'sortOrder'>;

export type LatestGenerationRow = { id: string; generatedAt: Date };

export type BudgetPlanWithRelations = BudgetPlan & {
  planContext?: PlanContextRelationRow | null;
  mealTypes?: MealTypeOnPlanRow[];
  latestGeneration?: LatestGenerationRow | null;
};

export type BudgetPlanIncludeFlags = {
  withContext?: boolean;
  withMealTypes?: boolean;
  withLatestGeneration?: boolean;
};

// Shared `with:` builder for the relational query. Keeps the loader shape in
// one place so the three find* functions below stay in sync.
function buildWithClause(include: BudgetPlanIncludeFlags) {
  return {
    ...(include.withContext && {
      planContext: {
        columns: {
          totalBudget: true,
          amountSpent: true,
          amountRemaining: true,
          totalMeals: true,
          mealsConsumed: true,
          mealsRemaining: true,
          avgBudgetPerRemainingMeal: true,
          cumulativeVariance: true,
        },
      } as const,
    }),
    ...(include.withMealTypes && {
      budgetPlanMealTypes: {
        columns: { position: true },
        with: {
          mealType: {
            columns: { id: true, key: true, label: true, sortOrder: true },
          },
        },
        orderBy: asc(budgetPlanMealType.position),
      } as const,
    }),
    ...(include.withLatestGeneration && {
      mealGenerations: {
        columns: { id: true, generatedAt: true },
        orderBy: desc(mealPlanGeneration.generatedAt),
        limit: 1,
      } as const,
    }),
  };
}

type RelationRow = BudgetPlan & {
  planContext?: PlanContextRelationRow | null;
  budgetPlanMealTypes?: { position: number; mealType: MealTypeOnPlanRow }[];
  mealGenerations?: LatestGenerationRow[];
};

function shapeRow(row: RelationRow, include: BudgetPlanIncludeFlags): BudgetPlanWithRelations {
  const { budgetPlanMealTypes, mealGenerations, planContext: ctx, ...base } = row;
  const out: BudgetPlanWithRelations = base as BudgetPlan;
  if (include.withContext) out.planContext = ctx ?? null;
  if (include.withMealTypes) {
    out.mealTypes = (budgetPlanMealTypes ?? []).map((bpmt) => bpmt.mealType);
  }
  if (include.withLatestGeneration) {
    out.latestGeneration = mealGenerations?.[0] ?? null;
  }
  return out;
}

// ─── Repository ───────────────────────────────────────────────────────────────

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

  async update(id: string, data: UpdateBudgetPlan): Promise<BudgetPlan> {
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

  // ─── Relation-enriched loaders ───────────────────────────────────────────
  //
  // Composition rule: when all tables hang off a single aggregate root with
  // cascade FKs (plan_context 1:1, budgetPlanMealType 1:N, mealGenerations 1:N),
  // load them in one round-trip via Drizzle's relational `.with()` builder.

  async findByIdWithRelations(
    id: string,
    include: BudgetPlanIncludeFlags = {},
  ): Promise<BudgetPlanWithRelations | undefined> {
    const row = await db.query.budgetPlan.findFirst({
      where: eq(budgetPlan.id, id),
      with: buildWithClause(include),
    });
    return row ? shapeRow(row as RelationRow, include) : undefined;
  },

  async findActiveByUserIdWithRelations(
    userId: string,
    include: BudgetPlanIncludeFlags = {},
  ): Promise<BudgetPlanWithRelations | undefined> {
    const row = await db.query.budgetPlan.findFirst({
      where: and(eq(budgetPlan.userId, userId), eq(budgetPlan.status, 'active')),
      orderBy: desc(budgetPlan.startDate),
      with: buildWithClause(include),
    });
    return row ? shapeRow(row as RelationRow, include) : undefined;
  },

  async listByUserIdWithRelations(
    userId: string,
    opts: {
      limit?: number;
      offset?: number;
      status?: 'active' | 'completed' | 'cancelled';
    } & BudgetPlanIncludeFlags = {},
  ): Promise<BudgetPlanWithRelations[]> {
    const { limit = 20, offset = 0, status, ...include } = opts;
    const whereExpr = status
      ? and(eq(budgetPlan.userId, userId), eq(budgetPlan.status, status))
      : eq(budgetPlan.userId, userId);
    const rows = await db.query.budgetPlan.findMany({
      where: whereExpr,
      orderBy: desc(budgetPlan.startDate),
      limit,
      offset,
      with: buildWithClause(include),
    });
    return (rows as RelationRow[]).map((r) => shapeRow(r, include));
  },

  async countByUserId(
    userId: string,
    status?: 'active' | 'completed' | 'cancelled',
  ): Promise<number> {
    const whereExpr = status
      ? and(eq(budgetPlan.userId, userId), eq(budgetPlan.status, status))
      : eq(budgetPlan.userId, userId);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(budgetPlan)
      .where(whereExpr);
    return row?.count ?? 0;
  },

  /**
   * Transactional create: budget_plan + budget_plan_meal_type links + plan_context
   * row (source of truth for running budget state) are inserted atomically.
   * Callers should never need to remember the three-step dance.
   */
  async createWithRelations(
    data: NewBudgetPlan,
    mealTypeIds: string[],
    initialContext: Omit<NewPlanContext, 'budgetPlanId'>,
  ): Promise<BudgetPlan> {
    return db.transaction(async (tx) => {
      const [inserted] = await tx.insert(budgetPlan).values(data).returning();
      if (!inserted) throw new Error('BudgetPlan insert failed');

      if (mealTypeIds.length) {
        const links: NewBudgetPlanMealType[] = mealTypeIds.map((mealTypeId, i) => ({
          budgetPlanId: inserted.id,
          mealTypeId,
          position: i,
        }));
        await tx.insert(budgetPlanMealType).values(links);
      }

      await tx.insert(planContext).values({ ...initialContext, budgetPlanId: inserted.id });

      return inserted;
    });
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

// Re-exported so services can pass-through tx handles without importing from db.js
export type { DbOrTx };
