import type {
  GetSuggestionsQuery,
  PlanTimelineDay,
  PlanTimelineLoggedChoice,
  PlanTimelineResponse,
  PlanTimelineSlot,
  SuggestionOption,
} from '@repo/shared';
import { toNumber, toNumberOrNull } from '@repo/shared';
import {
  budgetPlanRepository,
  mealPinRepository,
  mealPlanRepository,
  mealTypeRepository,
  orderRepository,
} from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';

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
function pinToOption(
  pin: Awaited<ReturnType<typeof mealPinRepository.getPinsForDay>>[number],
): SuggestionOption {
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

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function* iterateDates(startDate: string, endDate: string): Generator<string> {
  // Anchor at noon UTC so DST shifts in the user's locale can never bump us
  // back a calendar day when we slice toISOString.
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    yield new Date(t).toISOString().slice(0, 10);
  }
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
          options: pinned ? [pinToOption(pinned)] : (bySlot.get(mt.id) ?? []).map(toOption),
        };
      });

    return {
      date: query.date,
      slots: query.mealTypeId ? slots.filter((s) => s.mealTypeId === query.mealTypeId) : slots,
    };
  },

  /**
   * The plan's full living timeline: every day from startDate..endDate, every
   * meal-type slot, with the same priority the rest of the read path uses —
   * logged choice > pin > active-generation suggestion > empty. This is the
   * "what will I actually eat each day" view, including past days that already
   * have a logged choice.
   *
   * Single read across pins/choices/suggestions, then bucketed in memory; the
   * date range is bounded by plan length (≤31 days for monthly plans) so the
   * payload stays small enough to send eagerly without pagination.
   */
  async getTimeline(userId: string, planId: string): Promise<PlanTimelineResponse> {
    const plan = await budgetPlanRepository.findById(planId);
    if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
    if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');

    const activeGenerationId =
      (await mealPlanRepository.getLatestSucceededGenerationId(planId)) ?? null;

    const [suggestions, pins, choices, planMealTypes] = await Promise.all([
      activeGenerationId
        ? mealPlanRepository.getSuggestionsForGeneration(activeGenerationId)
        : Promise.resolve([] as SuggestionRow[]),
      mealPinRepository.listByPlan(planId),
      orderRepository.listByPlanWithItem(userId, planId),
      budgetPlanRepository.getMealTypesWithDetails(planId),
    ]);

    // Bucketise everything by (slotDate -> mealTypeId) so per-cell reads in
    // the date loop are O(1).
    const suggestionsByCell = new Map<string, SuggestionRow[]>();
    for (const s of suggestions as SuggestionRow[]) {
      const key = `${s.slotDate}|${s.mealTypeId}`;
      const bucket = suggestionsByCell.get(key) ?? [];
      bucket.push(s);
      suggestionsByCell.set(key, bucket);
    }

    const pinByCell = new Map<string, (typeof pins)[number]>();
    for (const p of pins) {
      pinByCell.set(`${p.slotDate}|${p.mealTypeId}`, p);
    }

    // For choices we only keep the most recent per (date, mealType) — the
    // application enforces one choice per slot, but if a duplicate ever slips
    // through this guard means we surface the latest write.
    const choiceByCell = new Map<string, (typeof choices)[number]>();
    for (const c of choices) {
      choiceByCell.set(`${c.slotDate}|${c.mealTypeId}`, c);
    }

    const today = todayDateString();
    const days: PlanTimelineDay[] = [];

    for (const slotDate of iterateDates(plan.startDate, plan.endDate)) {
      const slots: PlanTimelineSlot[] = planMealTypes.map((mt): PlanTimelineSlot => {
        const cellKey = `${slotDate}|${mt.id}`;
        const choice = choiceByCell.get(cellKey);
        if (choice) {
          const logged: PlanTimelineLoggedChoice = {
            id: choice.id,
            restaurantName: choice.restaurantName,
            menuItemName: choice.menuItemName,
            manualDescription: choice.manualDescription,
            actualAmountSpent: toNumber(choice.actualAmountSpent),
            isCustom: choice.suggestionId === null && choice.menuItemId === null,
          };
          return {
            mealTypeId: mt.id,
            mealTypeKey: mt.key,
            mealTypeLabel: mt.label,
            status: 'logged',
            loggedChoice: logged,
            options: [],
          };
        }

        const pin = pinByCell.get(cellKey);
        if (pin) {
          return {
            mealTypeId: mt.id,
            mealTypeKey: mt.key,
            mealTypeLabel: mt.label,
            status: 'pinned',
            loggedChoice: null,
            options: [pinToOption(pin)],
          };
        }

        const slotSuggestions = suggestionsByCell.get(cellKey);
        if (slotSuggestions && slotSuggestions.length > 0) {
          return {
            mealTypeId: mt.id,
            mealTypeKey: mt.key,
            mealTypeLabel: mt.label,
            status: 'suggested',
            loggedChoice: null,
            options: slotSuggestions.map(toOption),
          };
        }

        return {
          mealTypeId: mt.id,
          mealTypeKey: mt.key,
          mealTypeLabel: mt.label,
          status: 'empty',
          loggedChoice: null,
          options: [],
        };
      });

      const relative: PlanTimelineDay['relative'] =
        slotDate < today ? 'past' : slotDate === today ? 'today' : 'future';

      days.push({ slotDate, relative, slots });
    }

    return {
      planId: plan.id,
      startDate: plan.startDate,
      endDate: plan.endDate,
      activeGenerationId,
      days,
    };
  },
};
