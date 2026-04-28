import type { GetSuggestionsQuery } from '@repo/shared';
import { toNumber, toNumberOrNull } from '@repo/shared';
import { budgetPlanRepository, mealPlanRepository, mealTypeRepository } from '@repo/database';

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
    if (!activePlan) return { date: query.date, slots: [] };

    // Resolve via the latest *succeeded* generation specifically. A pending or
    // failed replan in flight must not blank out the in-place plan; the user
    // keeps reading from the previous successful gen until a new one succeeds.
    const generationId = await mealPlanRepository.getLatestSucceededGenerationId(activePlan.id);
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
