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

export type LatestGenerationRow = {
  id: string;
  generatedAt: Date;
  status: 'pending' | 'succeeded' | 'failed' | 'superseded';
  errorCode: string | null;
  errorMessage: string | null;
  completedAt: Date | null;
};

export type BudgetPlanWithRelations = BudgetPlan & {
  planContext?: PlanContextRelationRow | null;
  mealTypes?: MealTypeOnPlanRow[];
  /**
   * Latest *succeeded* generation. This is the source-of-truth pointer for
   * what the suggestions screen renders. Stable across pending/failed replans.
   */
  activeGeneration?: LatestGenerationRow | null;
  /**
   * Latest generation by `generatedAt` regardless of status. Used as the UX
   * signal: drives "regenerating…" banners while pending, "replan failed: X"
   * banners while failed, hidden while superseded or when it equals
   * `activeGeneration`.
   */
  latestAttempt?: LatestGenerationRow | null;
};

export type BudgetPlanIncludeFlags = {
  withContext?: boolean;
  withMealTypes?: boolean;
  /**
   * When true, the loader populates BOTH `activeGeneration` (latest succeeded)
   * and `latestAttempt` (latest by generatedAt, any status). Two cheap selects
   * — drizzle's relational `with` can't express two differently-filtered limit-1
   * orderings cleanly, so we lift one of them out.
   */
  withLatestGeneration?: boolean;
};

const generationColumns = {
  id: true,
  generatedAt: true,
  status: true,
  errorCode: true,
  errorMessage: true,
  completedAt: true,
} as const;

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
      // The relational with serves `latestAttempt` (any status, latest by time).
      // `activeGeneration` is fetched separately below — see hydrateGenerationPointers.
      mealGenerations: {
        columns: generationColumns,
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
    out.latestAttempt = mealGenerations?.[0] ?? null;
    // activeGeneration is hydrated below in a follow-up query (see
    // hydrateGenerationPointers). When absent (no rows / not requested), it
    // stays undefined and the public DTO mapper coerces to null.
  }
  return out;
}

// Second select for the activeGeneration pointer. Cheap, hits the partial-index
// candidates efficiently because the latest-succeeded row is virtually always at
// the head of the per-plan index.
async function hydrateGenerationPointers(
  rows: BudgetPlanWithRelations[],
  include: BudgetPlanIncludeFlags,
): Promise<void> {
  if (!include.withLatestGeneration || rows.length === 0) return;

  // Optimisation: when latestAttempt itself is succeeded, it IS the active gen.
  const needsLookup = rows.filter((r) => r.latestAttempt?.status !== 'succeeded');
  for (const r of rows) {
    if (r.latestAttempt?.status === 'succeeded') {
      r.activeGeneration = r.latestAttempt;
    }
  }
  if (needsLookup.length === 0) return;

  // Per-plan one-shot select. Could be a window-function batch, but plan counts
  // here are tiny (single-plan reads dominate; list endpoints page to ~20).
  await Promise.all(
    needsLookup.map(async (r) => {
      const [active] = await db
        .select({
          id: mealPlanGeneration.id,
          generatedAt: mealPlanGeneration.generatedAt,
          status: mealPlanGeneration.status,
          errorCode: mealPlanGeneration.errorCode,
          errorMessage: mealPlanGeneration.errorMessage,
          completedAt: mealPlanGeneration.completedAt,
        })
        .from(mealPlanGeneration)
        .where(
          and(
            eq(mealPlanGeneration.budgetPlanId, r.id),
            eq(mealPlanGeneration.status, 'succeeded'),
          ),
        )
        .orderBy(desc(mealPlanGeneration.generatedAt))
        .limit(1);
      r.activeGeneration = (active as LatestGenerationRow | undefined) ?? null;
    }),
  );
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

  /**
   * SELECT FOR UPDATE the user's active plan inside a transaction so the
   * lazy-complete check + status flip + downstream uniqueness check all
   * observe consistent row state. Used by `budgetPlanService.create()` as
   * the precondition gate; the partial unique index on (userId WHERE
   * status='active') is the final backstop.
   */
  async findActiveByUserIdForUpdate(userId: string, tx: DbOrTx): Promise<BudgetPlan | undefined> {
    const [row] = await tx
      .select()
      .from(budgetPlan)
      .where(and(eq(budgetPlan.userId, userId), eq(budgetPlan.status, 'active')))
      .for('update')
      .limit(1);
    return row;
  },

  /**
   * Conditional lazy-completion bound to expiry. Flips status to 'completed'
   * only when the row is still 'active' AND endDate < today. Lets a
   * concurrent cancel() win the race cleanly. Returns the updated row, or
   * undefined when nothing flipped.
   *
   * TODO(cron): replace this read-time fixer with a nightly cron when one
   * exists. Until then every read is the deadline-watcher.
   */
  async completeIfExpiredById(
    planId: string,
    today: string,
    tx?: DbOrTx,
  ): Promise<BudgetPlan | undefined> {
    const exec = tx ?? db;
    const [row] = await exec
      .update(budgetPlan)
      .set({ status: 'completed' })
      .where(
        and(
          eq(budgetPlan.id, planId),
          eq(budgetPlan.status, 'active'),
          sql`${budgetPlan.endDate} < ${today}`,
        ),
      )
      .returning();
    return row;
  },

  /**
   * Bulk lazy-completion for a user. One UPDATE retires every active plan
   * whose endDate has passed. Used by list read paths so callers never see
   * stale "active but expired" rows.
   */
  async completeExpiredForUser(userId: string, today: string): Promise<number> {
    const updated = await db
      .update(budgetPlan)
      .set({ status: 'completed' })
      .where(
        and(
          eq(budgetPlan.userId, userId),
          eq(budgetPlan.status, 'active'),
          sql`${budgetPlan.endDate} < ${today}`,
        ),
      )
      .returning({ id: budgetPlan.id });
    return updated.length;
  },

  /**
   * Atomic plan cancel + supersede in-flight generations. One transaction so
   * the FE never sees a "cancelled" plan whose pending generation row is
   * still pending. The conditional `markGenerationSucceeded` upstream means
   * any LLM call still in flight will roll back its suggestion insert when
   * it discovers the row is no longer pending.
   */
  async cancelWithPendingSupersede(planId: string): Promise<BudgetPlan> {
    return db.transaction(async (tx) => {
      const [plan] = await tx
        .update(budgetPlan)
        .set({ status: 'cancelled' })
        .where(eq(budgetPlan.id, planId))
        .returning();
      if (!plan) throw new Error('BudgetPlan not found');

      await tx
        .update(mealPlanGeneration)
        .set({ status: 'superseded', completedAt: new Date() })
        .where(
          and(
            eq(mealPlanGeneration.budgetPlanId, planId),
            eq(mealPlanGeneration.status, 'pending'),
          ),
        );
      return plan;
    });
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
    if (!row) return undefined;
    const shaped = shapeRow(row as RelationRow, include);
    await hydrateGenerationPointers([shaped], include);
    return shaped;
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
    if (!row) return undefined;
    const shaped = shapeRow(row as RelationRow, include);
    await hydrateGenerationPointers([shaped], include);
    return shaped;
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
    const shaped = (rows as RelationRow[]).map((r) => shapeRow(r, include));
    await hydrateGenerationPointers(shaped, include);
    return shaped;
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
  ): Promise<{ id: string; key: string; label: string; sortOrder: number }[]> {
    const rows = await db
      .select({
        id: mealType.id,
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
