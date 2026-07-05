import type { MealChoiceResponse, Paginated, RecordMealChoiceInput } from '@repo/shared';
import { toNumber } from '@repo/shared';
import {
  budgetPlanRepository,
  db,
  mealPinRepository,
  mealPlanRepository,
  orderRepository,
  planContextRepository,
} from '@repo/database';

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
  restaurantId: string | null;
  menuItemId: string | null;
  manualDescription: string | null;
  actualAmountSpent: string;
  restaurantName: string | null;
  menuItemName?: string | null;
  createdAt: Date;
}): MealChoiceResponse {
  return {
    id: c.id,
    budgetPlanId: c.budgetPlanId,
    slotDate: c.slotDate,
    mealTypeId: c.mealTypeId,
    suggestionId: c.suggestionId,
    restaurantId: c.restaurantId,
    menuItemId: c.menuItemId,
    manualDescription: c.manualDescription,
    actualAmountSpent: toNumber(c.actualAmountSpent),
    restaurantName: c.restaurantName,
    menuItemName: c.menuItemName ?? null,
    createdAt: c.createdAt,
  };
}

async function loadOwnedActive(userId: string, budgetPlanId: string) {
  const plan = await budgetPlanRepository.findById(budgetPlanId);
  if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
  if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return plan;
}

/**
 * If the caller supplied `suggestionId` but didn't pass `restaurantId` /
 * `menuItemId`, lift them off the suggestion. Lets the FE record-choice flow
 * keep its current minimal shape while we get structured links populated.
 *
 * Suggestions are whole orders and can combine several menu items; the single
 * `menuItemId` FK is only backfilled when the order has exactly one item. For
 * multi-item combos we instead backfill `manualDescription` with a combined
 * "Burger + Wings + Drink" label (unless the caller supplied their own) so the
 * logged choice still renders a human-readable title everywhere.
 *
 * Returns nothing — mutates `out` in place.
 */
async function backfillFksFromSuggestion(
  input: RecordMealChoiceInput,
  out: { restaurantId: string | null; menuItemId: string | null; manualDescription: string | null },
): Promise<void> {
  if (!input.suggestionId) return;
  if (out.restaurantId && out.menuItemId) return;
  const suggestion = await mealPlanRepository.getSuggestionForChoice(input.suggestionId);
  if (!suggestion) return;
  out.restaurantId = out.restaurantId ?? suggestion.restaurantId;
  if (suggestion.items.length === 1) {
    out.menuItemId = out.menuItemId ?? suggestion.items[0]!.menuItemId;
  } else if (suggestion.items.length > 1 && !out.manualDescription) {
    out.manualDescription = suggestion.items.map((i) => i.name).join(' + ');
  }
}

export const mealChoiceService = {
  /**
   * Record a confirmed meal choice and apply the delta to plan_context in the
   * same transaction. plan_context is the source of truth for amountSpent,
   * mealsConsumed, amountRemaining, etc. — GET endpoints read from there.
   *
   * If the (planId, slotDate, mealTypeId) had a user pin, the pin is deleted
   * in the same transaction — the choice supersedes the pin. This keeps the
   * pin-adjusted budget math from double-counting once a pin becomes a real
   * meal choice.
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

    const fks = {
      restaurantId: input.restaurantId ?? null,
      menuItemId: input.menuItemId ?? null,
      manualDescription: input.manualDescription ?? null,
    };
    await backfillFksFromSuggestion(input, fks);

    const choice = await db.transaction(async (tx) => {
      const inserted = await orderRepository.create(
        {
          userId,
          budgetPlanId,
          slotDate: input.slotDate,
          mealTypeId: input.mealTypeId,
          suggestionId: input.suggestionId ?? null,
          restaurantId: fks.restaurantId,
          menuItemId: fks.menuItemId,
          manualDescription: fks.manualDescription,
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

      // Choice supersedes pin on the same slot. Idempotent — returns 0 when
      // there is no pin to delete.
      await mealPinRepository.deleteBySlot(budgetPlanId, input.slotDate, input.mealTypeId, tx);

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
