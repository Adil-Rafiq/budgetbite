import type { GetSuggestionsQuery } from '@repo/shared';
import { toNumber, toNumberOrNull } from '@repo/shared';
import { budgetPlanRepository, mealPlanRepository, mealTypeRepository } from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';

type SuggestionRow = Awaited<ReturnType<typeof mealPlanRepository.getSuggestionsForDay>>[number];

function toOption(o: SuggestionRow) {
  return {
    id: o.id,
    optionIndex: o.optionIndex,
    restaurantId: o.restaurantId,
    restaurantName: o.restaurant?.name,
    menuItemId: o.menuItemId,
    menuItemName: o.menuItem?.name,
    description: o.menuItem?.description ?? undefined,
    estimatedPrice:
      o.estimatedPrice != null
        ? toNumber(o.estimatedPrice)
        : (toNumberOrNull(o.menuItem?.price) ?? 0),
    notes: o.notes ?? undefined,
  };
}

export const mealPlanService = {
  async getSuggestionsForDay(userId: string, query: GetSuggestionsQuery) {
    const activePlan = await budgetPlanRepository.findActiveByUserId(userId);
    if (!activePlan) throw new AppError(400, 'No active budget plan', 'NO_ACTIVE_PLAN');

    const generationId = await mealPlanRepository.getLatestGenerationId(activePlan.id);
    if (!generationId) {
      return { date: query.date, slots: [] };
    }

    const [suggestions, mealTypes] = await Promise.all([
      mealPlanRepository.getSuggestionsForDay(generationId, query.date),
      mealTypeRepository.listActive(),
    ]);

    const bySlot = new Map<string, SuggestionRow[]>();
    for (const s of suggestions) {
      const bucket = bySlot.get(s.mealTypeId) ?? [];
      bucket.push(s);
      bySlot.set(s.mealTypeId, bucket);
    }

    const slots = mealTypes
      .filter((mt) => bySlot.has(mt.id))
      .map((mt) => ({
        mealTypeId: mt.id,
        mealTypeKey: mt.key,
        mealTypeLabel: mt.label,
        options: (bySlot.get(mt.id) ?? []).map(toOption),
      }));

    return {
      date: query.date,
      slots: query.mealTypeId ? slots.filter((s) => s.mealTypeId === query.mealTypeId) : slots,
    };
  },
};
