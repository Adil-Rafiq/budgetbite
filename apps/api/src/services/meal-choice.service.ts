import type { MealChoiceResponse, Paginated, RecordMealChoiceInput } from '@repo/shared';
import { toNumber } from '@repo/shared';
import { budgetPlanRepository, db, orderRepository, planContextRepository } from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';
import { mealGenerationService } from './meal-generation.service.js';

const DEFAULT_REPLAN_RATIO_THRESHOLD = 0.4;

function getReplanRatioThreshold(): number {
  const raw = process.env.REPLAN_CUMULATIVE_DEVIATION_RATIO_THRESHOLD;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REPLAN_RATIO_THRESHOLD;
}

function toMealChoiceResponse(c: {
  id: string;
  budgetPlanId: string;
  slotDate: string;
  mealTypeId: string;
  suggestionId: string | null;
  manualDescription: string | null;
  actualAmountSpent: string;
  restaurantName: string | null;
  createdAt: Date;
}): MealChoiceResponse {
  return {
    id: c.id,
    budgetPlanId: c.budgetPlanId,
    slotDate: c.slotDate,
    mealTypeId: c.mealTypeId,
    suggestionId: c.suggestionId,
    manualDescription: c.manualDescription,
    actualAmountSpent: toNumber(c.actualAmountSpent),
    restaurantName: c.restaurantName,
    createdAt: c.createdAt,
  };
}

async function loadOwnedActive(userId: string, budgetPlanId: string) {
  const plan = await budgetPlanRepository.findById(budgetPlanId);
  if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
  if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return plan;
}

export const mealChoiceService = {
  /**
   * Record a confirmed meal choice and apply the delta to plan_context in the
   * same transaction. plan_context is the source of truth for amountSpent,
   * mealsConsumed, amountRemaining, etc. — GET endpoints read from there.
   */
  async recordChoice(
    userId: string,
    budgetPlanId: string,
    input: RecordMealChoiceInput,
  ): Promise<MealChoiceResponse> {
    const plan = await loadOwnedActive(userId, budgetPlanId);
    if (plan.status !== 'active') {
      throw new AppError(400, 'Plan is not active', 'PLAN_NOT_ACTIVE');
    }

    const ctx = await planContextRepository.findByPlanId(budgetPlanId);
    if (!ctx) throw new AppError(500, 'Plan context missing', 'PLAN_CONTEXT_MISSING');
    const plannedMealBudget = toNumber(ctx.totalBudget) / Math.max(1, ctx.totalMeals);

    const choice = await db.transaction(async (tx) => {
      const inserted = await orderRepository.create(
        {
          userId,
          budgetPlanId,
          slotDate: input.slotDate,
          mealTypeId: input.mealTypeId,
          suggestionId: input.suggestionId ?? null,
          manualDescription: input.manualDescription ?? null,
          actualAmountSpent: String(input.actualAmountSpent),
          restaurantName: input.restaurantName ?? null,
        },
        tx,
      );

      await planContextRepository.updateForChoice(
        budgetPlanId,
        {
          spentAmount: input.actualAmountSpent,
          plannedMealBudget,
        },
        tx,
      );

      return inserted;
    });

    // Replan trigger: re-read plan_context (it was just updated above) and
    // kick off an async replan if cumulative deviation crossed the threshold.
    // Wrapped so any failure here cannot break the choice-record response.
    try {
      const refreshed = await planContextRepository.findByPlanId(budgetPlanId);
      if (refreshed) {
        const totalBudget = toNumber(refreshed.totalBudget);
        const variance = toNumber(refreshed.cumulativeVariance);
        const ratio = Math.abs(variance) / Math.max(totalBudget, 1);
        if (ratio > getReplanRatioThreshold()) {
          const triggerSummary =
            `User confirmed ${input.restaurantName ?? 'a meal'} on ${input.slotDate} ` +
            `for PKR ${input.actualAmountSpent} (planned PKR ${plannedMealBudget.toFixed(2)}). ` +
            `Cumulative variance is now PKR ${variance.toFixed(2)} ` +
            `(${(ratio * 100).toFixed(1)}% of total budget).`;
          mealGenerationService.kickoffReplanAsync(userId, budgetPlanId, triggerSummary);
        }
      }
    } catch (err) {
      console.error('[mealChoiceService] failed to evaluate replan trigger', err);
    }

    return toMealChoiceResponse(choice);
  },

  async listByPlan(
    userId: string,
    budgetPlanId: string,
    opts: { limit: number; offset: number },
  ): Promise<Paginated<MealChoiceResponse>> {
    // FIXME: verify the budgetPlanId belongs to the current user
    // FIXME: right now the query does not return the meal name, only the restaurant name is returned
    const [rows, total] = await Promise.all([
      orderRepository.listByUserAndPlanWithPagination(userId, budgetPlanId, opts),
      orderRepository.countByPlan(userId, budgetPlanId),
    ]);
    return {
      data: rows.map(toMealChoiceResponse),
      meta: { total, limit: opts.limit, offset: opts.offset },
    };
  },
};
