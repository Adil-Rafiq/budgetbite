import type {
  ActiveBudgetPlanResponse,
  BudgetGeneration,
  BudgetGenerationDayGroup,
  BudgetGenerationDetailResponse,
  BudgetPlanDetail,
  BudgetPlanResponse,
  BudgetStateContext,
  CreateBudgetPlanInput,
  ListBudgetGenerationsResponse,
  ListBudgetPlansQuery,
  Paginated,
  PaginationQuery,
  UpdateBudgetPlanInput,
} from '@repo/shared';
import { toNumber } from '@repo/shared';
import {
  budgetPlanRepository,
  mealPlanRepository,
  mealTypeRepository,
  planContextRepository,
  type BudgetPlanWithRelations,
  type MealPlanGeneration,
  type PlanContextRelationRow,
} from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';
import { mealGenerationService, type GenerationResult } from './meal-generation.service.js';
import { toOption, type SuggestionRow } from './meal-plan.service.js';

// ─── Composition rule (for future contributors) ──────────────────────────────
// Reads that hydrate a budget plan with its owned children (plan_context 1:1,
// budget_plan_meal_type 1:N, latest meal_plan_generation) go through
// budgetPlanRepository.findXxxWithRelations — one round trip, one shape.
//
// Reads that need to cross into other aggregates (e.g. meal choices, feedback)
// compose repos here in the service with Promise.all.
//
// Writes that must be atomic (plan create, choice record) go through a repo
// method that opens its own transaction, or through db.transaction() in this
// file passing `tx` to every repo call.
// ─────────────────────────────────────────────────────────────────────────────

function totalMealsForPlan(input: {
  mealsPerDay: number;
  startDate: string;
  endDate: string;
}): number {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);
  return input.mealsPerDay * days;
}

function toBudgetStateContext(ctx: PlanContextRelationRow): BudgetStateContext {
  return {
    totalBudget: toNumber(ctx.totalBudget),
    amountSpent: toNumber(ctx.amountSpent),
    amountRemaining: toNumber(ctx.amountRemaining),
    totalMeals: ctx.totalMeals,
    mealsConsumed: ctx.mealsConsumed,
    mealsRemaining: ctx.mealsRemaining,
    avgBudgetPerRemainingMeal: toNumber(ctx.avgBudgetPerRemainingMeal),
    cumulativeVariance: toNumber(ctx.cumulativeVariance),
  };
}

function toBudgetPlanResponse(plan: BudgetPlanWithRelations): BudgetPlanResponse {
  const ctx = plan.planContext;
  const spent = ctx ? toNumber(ctx.amountSpent) : 0;
  const totalBudget = toNumber(plan.totalBudget);
  return {
    id: plan.id,
    userId: plan.userId,
    planType: plan.planType as 'weekly' | 'monthly',
    totalBudget,
    startDate: plan.startDate,
    endDate: plan.endDate,
    mealsPerDay: plan.mealsPerDay,
    notificationTimes: plan.notificationTimes ?? [],
    status: plan.status as 'active' | 'completed' | 'cancelled',
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    mealTypes: plan.mealTypes ?? [],
    spentAmount: spent,
    remainingAmount: totalBudget - spent,
  };
}

function toBudgetPlanDetail(plan: BudgetPlanWithRelations): BudgetPlanDetail {
  if (!plan.planContext) {
    throw new AppError(500, 'Plan context missing', 'PLAN_CONTEXT_MISSING');
  }
  return {
    ...toBudgetPlanResponse(plan),
    context: toBudgetStateContext(plan.planContext),
    activeGeneration: plan.activeGeneration ?? null,
    latestAttempt: plan.latestAttempt ?? null,
  };
}

async function loadOwned(userId: string, planId: string) {
  const plan = await budgetPlanRepository.findByIdWithRelations(planId, {
    withContext: true,
    withMealTypes: true,
    withLatestGeneration: true,
  });
  if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
  if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return plan;
}

export const budgetPlanService = {
  async create(userId: string, input: CreateBudgetPlanInput): Promise<BudgetPlanResponse> {
    const totalMeals = totalMealsForPlan(input);
    const avg = input.totalBudget / totalMeals;

    await budgetPlanRepository.createWithRelations(
      {
        userId,
        planType: input.planType,
        totalBudget: String(input.totalBudget),
        startDate: input.startDate,
        endDate: input.endDate,
        mealsPerDay: input.mealsPerDay,
        notificationTimes: input.notificationTimes ?? null,
        status: 'active',
      },
      input.mealTypeIds,
      {
        totalBudget: String(input.totalBudget),
        amountSpent: '0',
        amountRemaining: String(input.totalBudget),
        totalMeals,
        mealsConsumed: 0,
        mealsRemaining: totalMeals,
        avgBudgetPerRemainingMeal: avg.toFixed(2),
        cumulativeVariance: '0',
      },
    );

    // Re-fetch with relations so the response embeds mealTypes + spent/remaining.
    const created = await budgetPlanRepository.findActiveByUserIdWithRelations(userId, {
      withContext: true,
      withMealTypes: true,
    });
    if (!created) throw new AppError(500, 'Created plan could not be loaded', 'INTERNAL_ERROR');

    // Async fire-and-forget AI generation — never blocks the create response.
    if (process.env.AUTO_GENERATE_ON_CREATE === 'true') {
      mealGenerationService.kickoffGenerationAsync(userId, created.id);
    }

    return toBudgetPlanResponse(created);
  },

  async list(userId: string, query: ListBudgetPlansQuery): Promise<Paginated<BudgetPlanResponse>> {
    const [rows, total] = await Promise.all([
      budgetPlanRepository.listByUserIdWithRelations(userId, {
        limit: query.limit,
        offset: query.offset,
        status: query.status,
        withContext: true,
        withMealTypes: true,
      }),
      budgetPlanRepository.countByUserId(userId, query.status),
    ]);
    return {
      data: rows.map(toBudgetPlanResponse),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  async getById(userId: string, planId: string): Promise<BudgetPlanDetail> {
    const plan = await loadOwned(userId, planId);
    return toBudgetPlanDetail(plan);
  },

  async getActive(userId: string): Promise<ActiveBudgetPlanResponse | null> {
    const plan = await budgetPlanRepository.findActiveByUserIdWithRelations(userId, {
      withContext: true,
      withMealTypes: true,
    });
    if (!plan) return null;
    if (!plan.planContext) {
      throw new AppError(500, 'Plan context missing', 'PLAN_CONTEXT_MISSING');
    }
    return {
      plan: toBudgetPlanResponse(plan),
      budgetState: toBudgetStateContext(plan.planContext),
    };
  },

  async getContext(userId: string, planId: string): Promise<BudgetStateContext> {
    // Small cross-aggregate dance: we need ownership but only the context row.
    const plan = await budgetPlanRepository.findById(planId);
    if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
    if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');

    const ctx = await planContextRepository.findByPlanId(planId);
    if (!ctx) throw new AppError(500, 'Plan context missing', 'PLAN_CONTEXT_MISSING');
    return toBudgetStateContext(ctx);
  },

  async update(
    userId: string,
    planId: string,
    input: UpdateBudgetPlanInput,
  ): Promise<BudgetPlanResponse> {
    const existing = await budgetPlanRepository.findById(planId);
    if (!existing) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
    if (existing.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');

    await budgetPlanRepository.update(planId, {
      totalBudget: input.totalBudget != null ? String(input.totalBudget) : undefined,
      notificationTimes: input.notificationTimes ?? undefined,
      status: input.status,
    });

    const reloaded = await budgetPlanRepository.findByIdWithRelations(planId, {
      withContext: true,
      withMealTypes: true,
    });
    if (!reloaded) throw new AppError(500, 'Updated plan could not be loaded', 'INTERNAL_ERROR');
    return toBudgetPlanResponse(reloaded);
  },

  async generateMealPlan(userId: string, planId: string): Promise<GenerationResult | null> {
    return mealGenerationService.generate(userId, planId);
  },

  /**
   * Paginated list of every generation row for a plan ordered newest-first.
   * Drives the Generation History timeline on the FE plan detail page.
   */
  async listGenerations(
    userId: string,
    planId: string,
    query: PaginationQuery,
  ): Promise<ListBudgetGenerationsResponse> {
    await assertOwned(userId, planId);
    const [rows, total] = await Promise.all([
      mealPlanRepository.listGenerations(planId, { limit: query.limit, offset: query.offset }),
      mealPlanRepository.countGenerations(planId),
    ]);
    return {
      data: rows.map(toBudgetGeneration),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  /**
   * Full detail for a single generation: row metadata + grouped suggestions.
   * Suggestions are returned grouped by `slotDate` then by mealType (sorted by
   * `mealType.sortOrder`) so the FE can render a vertical day-by-day grid
   * without doing client-side bucketing.
   *
   * Non-succeeded statuses (pending/failed/superseded) return `days: []` —
   * there are no persisted suggestions in those states; the row's
   * `errorCode`/`errorMessage` carry the relevant context for failed gens.
   */
  async getGenerationDetail(
    userId: string,
    planId: string,
    generationId: string,
  ): Promise<BudgetGenerationDetailResponse> {
    await assertOwned(userId, planId);

    const gen = await mealPlanRepository.getGenerationById(generationId);
    if (!gen || gen.budgetPlanId !== planId) {
      throw new AppError(404, 'Generation not found', 'NOT_FOUND');
    }

    if (gen.status !== 'succeeded') {
      return { generation: toBudgetGeneration(gen), days: [] };
    }

    const [suggestions, mealTypes] = await Promise.all([
      mealPlanRepository.getSuggestionsForGeneration(generationId),
      mealTypeRepository.listActive(),
    ]);

    // Group suggestions: slotDate -> mealTypeId -> rows. Then materialize into
    // ordered day groups, with mealTypes ordered by mealType.sortOrder so the
    // grid reads breakfast/lunch/dinner consistently.
    const byDate = new Map<string, Map<string, SuggestionRow[]>>();
    for (const s of suggestions as SuggestionRow[]) {
      let bySlot = byDate.get(s.slotDate);
      if (!bySlot) {
        bySlot = new Map();
        byDate.set(s.slotDate, bySlot);
      }
      const bucket = bySlot.get(s.mealTypeId) ?? [];
      bucket.push(s);
      bySlot.set(s.mealTypeId, bucket);
    }

    const days: BudgetGenerationDayGroup[] = Array.from(byDate.keys())
      .sort()
      .map((slotDate) => {
        const bySlot = byDate.get(slotDate)!;
        const slots = mealTypes
          .filter((mt) => bySlot.has(mt.id))
          .map((mt) => ({
            mealTypeId: mt.id,
            mealTypeKey: mt.key,
            mealTypeLabel: mt.label,
            options: (bySlot.get(mt.id) ?? []).map(toOption),
          }));
        return { slotDate, slots };
      });

    return { generation: toBudgetGeneration(gen), days };
  },
};

function toBudgetGeneration(row: MealPlanGeneration): BudgetGeneration {
  return {
    id: row.id,
    generatedAt: row.generatedAt,
    status: row.status,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    completedAt: row.completedAt,
  };
}

async function assertOwned(userId: string, planId: string): Promise<void> {
  const plan = await budgetPlanRepository.findById(planId);
  if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
  if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}
