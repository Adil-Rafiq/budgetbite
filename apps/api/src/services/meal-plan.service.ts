import type { GetSuggestionsQuery, SuggestionOption } from '@repo/shared';
import { toNumber, toNumberOrNull } from '@repo/shared';
import {
  budgetPlanRepository,
  mealPinRepository,
  mealPlanRepository,
  mealTypeRepository,
} from '@repo/database';

export type SuggestionRow = Awaited<
  ReturnType<typeof mealPlanRepository.getSuggestionsForDay>
>[number];

export function toOption(o: SuggestionRow): SuggestionOption {
  return {
    id: o.id,
    optionIndex: o.optionIndex,
    restaurantId: o.restaurantId,
    restaurantName: o.restaurant?.name ?? null,
    menuItemId: o.menuItemId,
    menuItemName: o.menuItem?.name ?? null,
    description: o.menuItem?.description ?? undefined,
    estimatedPrice:
      o.estimatedPrice != null
        ? toNumber(o.estimatedPrice)
        : (toNumberOrNull(o.menuItem?.price) ?? 0),
    notes: o.notes ?? undefined,
    source: 'suggestion',
  };
}

/**
 * Materialize a pin row as a single-option SuggestionOption so the merged
 * day view returned by getSuggestionsForDay has a uniform shape regardless
 * of whether a slot is AI-suggested or user-pinned.
 */
function pinToOption(pin: Awaited<ReturnType<typeof mealPinRepository.getPinsForDay>>[number]): SuggestionOption {
  return {
    // Pins live in their own table — `id` carries the pin row id so the FE
    // has a stable handle for unpin actions, but it is not a suggestion id.
    id: pin.id,
    optionIndex: 0,
    restaurantId: pin.restaurantId,
    restaurantName: pin.restaurant.name,
    menuItemId: pin.menuItemId,
    menuItemName: pin.menuItem.name,
    description: pin.menuItem.description ?? undefined,
    estimatedPrice: toNumber(pin.priceAtPin),
    notes: undefined,
    source: 'pin',
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

    const [suggestions, pins, mealTypes] = await Promise.all([
      generationId
        ? mealPlanRepository.getSuggestionsForDay(generationId, query.date)
        : Promise.resolve([] as SuggestionRow[]),
      mealPinRepository.getPinsForDay(activePlan.id, query.date),
      mealTypeRepository.listActive(),
    ]);

    if (!generationId && pins.length === 0) {
      return { date: query.date, slots: [] };
    }

    const bySlot = new Map<string, SuggestionRow[]>();
    for (const s of suggestions) {
      const bucket = bySlot.get(s.mealTypeId) ?? [];
      bucket.push(s);
      bySlot.set(s.mealTypeId, bucket);
    }

    // Pin merge: for any (date, mealTypeId) with a pin, the pin wins. Pins are
    // a present-day concept and always override whatever the AI generated for
    // that slot — the AI's stale row is harmless dead data either way.
    const pinByMealType = new Map(pins.map((p) => [p.mealTypeId, p] as const));

    const slots = mealTypes
      .filter((mt) => bySlot.has(mt.id) || pinByMealType.has(mt.id))
      .map((mt) => {
        const pinned = pinByMealType.get(mt.id);
        return {
          mealTypeId: mt.id,
          mealTypeKey: mt.key,
          mealTypeLabel: mt.label,
          options: pinned
            ? [pinToOption(pinned)]
            : (bySlot.get(mt.id) ?? []).map(toOption),
        };
      });

    return {
      date: query.date,
      slots: query.mealTypeId ? slots.filter((s) => s.mealTypeId === query.mealTypeId) : slots,
    };
  },
};
