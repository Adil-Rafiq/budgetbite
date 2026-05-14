import {
  restaurantRepository,
  menuRepository,
  budgetPlanRepository,
  mealPinRepository,
  planContextRepository,
  userPreferencesRepository,
  orderRepository,
  userProfileRepository,
} from '@repo/database';
import type {
  MealPlannerContext,
  PlanMetaContext,
  BudgetStateContext,
  UserPreferencesContext,
  NearbyRestaurantContext,
} from '@repo/shared';

const NEARBY_RADIUS_KM = Number(process.env.NEARBY_RADIUS_KM) || 5;
const MAX_RESTAURANTS = Number(process.env.MAX_RESTAURANTS) || 20;
const MAX_ITEMS_PER_RESTAURANT = Number(process.env.MAX_ITEMS_PER_RESTAURANT) || 15;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Subtract pinned-slot allocation from raw budget state. plan_context tracks
 * choice-driven spend only — pins are pre-allocations the user has committed
 * to but not yet logged, so for the LLM (and the FE budget-fit indicator) we
 * present a budget that already accounts for them.
 *
 * Adjusted fields: amountRemaining, mealsRemaining, avgBudgetPerRemainingMeal.
 * Untouched: amountSpent, mealsConsumed, totalBudget, totalMeals, cumulativeVariance.
 */
export function applyPinAdjustment(
  raw: BudgetStateContext,
  pinSpend: number,
  pinCount: number,
): BudgetStateContext {
  const amountRemaining = Math.max(0, raw.amountRemaining - pinSpend);
  const mealsRemaining = Math.max(0, raw.mealsRemaining - pinCount);
  const avgBudgetPerRemainingMeal = mealsRemaining > 0 ? amountRemaining / mealsRemaining : 0;
  return {
    ...raw,
    amountRemaining,
    mealsRemaining,
    avgBudgetPerRemainingMeal,
  };
}

/**
 * ContextBuilderService
 *
 * Single responsibility: assemble the full MealPlannerContext object
 * that gets injected into every LLM call.
 *
 * All geo-spatial filtering and arithmetic is done HERE — not in the LLM.
 */
export const contextBuilderService = {
  async build(budgetPlanId: string, userId: string): Promise<MealPlannerContext> {
    const fromDate = todayDateString();

    const [plan, rawBudget, preferences, remainingDates, pinnedSlots, pinAggregate] =
      await Promise.all([
        this.fetchPlanMeta(budgetPlanId),
        this.fetchRawBudgetState(budgetPlanId),
        this.fetchUserPreferences(userId),
        this.fetchRemainingDates(budgetPlanId),
        mealPinRepository.getPinnedSlotsForGeneration(budgetPlanId, fromDate),
        mealPinRepository.sumFutureForPlan(budgetPlanId, fromDate),
      ]);

    const budget = applyPinAdjustment(
      rawBudget,
      Number(pinAggregate.totalPriceAtPin),
      pinAggregate.count,
    );

    const userProfile = await this.fetchUserLocation(userId);
    const restaurants = userProfile
      ? await this.fetchNearbyRestaurants(
          userProfile.latitude,
          userProfile.longitude,
          preferences.dislikedRestaurantIds,
        )
      : [];

    return { plan, budget, preferences, restaurants, remainingDates, pinnedSlots };
  },

  // ─── Private fetchers ──────────────────────────────────────────────────────

  async fetchPlanMeta(budgetPlanId: string): Promise<PlanMetaContext> {
    const plan = await budgetPlanRepository.findById(budgetPlanId);
    if (!plan) throw new Error(`Budget plan ${budgetPlanId} not found`);

    const mealTypes = await budgetPlanRepository.getMealTypesWithDetails(budgetPlanId);

    return {
      budgetPlanId: plan.id,
      planType: plan.planType,
      startDate: plan.startDate,
      endDate: plan.endDate,
      mealTypes,
    };
  },

  /**
   * Raw budget state straight from plan_context. Callers that pass this to the
   * LLM or FE should `applyPinAdjustment` first so pinned spend is reflected
   * in amountRemaining / avgBudgetPerRemainingMeal.
   */
  async fetchRawBudgetState(budgetPlanId: string): Promise<BudgetStateContext> {
    const ctx = await planContextRepository.findByPlanId(budgetPlanId);
    if (!ctx) throw new Error(`Plan context for ${budgetPlanId} not found`);

    return {
      totalBudget: Number(ctx.totalBudget),
      amountSpent: Number(ctx.amountSpent),
      amountRemaining: Number(ctx.amountRemaining),
      totalMeals: ctx.totalMeals,
      mealsConsumed: ctx.mealsConsumed,
      mealsRemaining: ctx.mealsRemaining,
      avgBudgetPerRemainingMeal: Number(ctx.avgBudgetPerRemainingMeal),
      cumulativeVariance: Number(ctx.cumulativeVariance),
    };
  },

  async fetchUserPreferences(userId: string): Promise<UserPreferencesContext> {
    const prefs = await userPreferencesRepository.findByUserId(userId);
    return {
      dislikedRestaurantIds: prefs?.dislikedRestaurantIds ?? [],
      preferredCuisineTags: prefs?.preferredCuisineTags ?? [],
      dislikedCuisineTags: prefs?.dislikedCuisineTags ?? [],
      dietaryNotes: prefs?.dietaryNotes ?? [],
      feedbackSummary: prefs?.feedbackSummary ?? null,
      priceSensitivity: prefs?.priceSensitivity ?? 'mid',
    };
  },

  async fetchUserLocation(userId: string): Promise<{ latitude: number; longitude: number } | null> {
    const profile = await userProfileRepository.findByUserId(userId);
    if (!profile?.latitude || !profile?.longitude) return null;
    return { latitude: profile.latitude, longitude: profile.longitude };
  },

  /**
   * Fetch remaining dates that still need suggestions.
   * A date is "remaining" if it has no confirmed mealChoice yet and is today or in the future.
   * Pinned slots are NOT removed at the date level here — pins are per
   * (date, mealType) and are passed separately in `MealPlannerContext.pinnedSlots`
   * so the LLM can keep generating other meal types on a partially-pinned day.
   */
  async fetchRemainingDates(budgetPlanId: string): Promise<string[]> {
    const plan = await budgetPlanRepository.findById(budgetPlanId);
    if (!plan) return [];

    const today = new Date().toISOString().split('T')[0]!;
    const confirmedDates = await orderRepository.getConfirmedDatesFromToday(budgetPlanId);

    const start = new Date(plan.startDate > today ? plan.startDate : today);
    const end = new Date(plan.endDate);
    const dates: string[] = [];

    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split('T')[0]!;
      if (!confirmedDates.has(iso)) dates.push(iso);
    }

    return dates;
  },

  /**
   * Fetch nearby restaurants using the Haversine approximation in SQL.
   * Filters out disliked restaurants before returning.
   * Limits to MAX_RESTAURANTS to keep the LLM context manageable.
   */
  async fetchNearbyRestaurants(
    lat: number,
    lng: number,
    dislikedIds: string[],
  ): Promise<NearbyRestaurantContext[]> {
    const results = await restaurantRepository.list({
      userLat: lat,
      userLng: lng,
      maxDistanceKm: NEARBY_RADIUS_KM,
      limit: MAX_RESTAURANTS,
    });

    // Filter disliked restaurants
    const filtered = results.filter((r) => !dislikedIds.includes(r.restaurant.id));

    // Fetch menu items per restaurant
    const contexts: NearbyRestaurantContext[] = await Promise.all(
      filtered.map(async ({ restaurant: r, distanceKm }) => {
        const items = await menuRepository.findByRestaurantId(r.id);
        return {
          restaurantId: r.id,
          name: r.name,
          distanceKm: Number((distanceKm ?? 0).toFixed(2)),
          rating: r.rating ? Number(r.rating) : null,
          deliveryFee: r.deliveryFee ? Number(r.deliveryFee) : null,
          menuItems: items.slice(0, MAX_ITEMS_PER_RESTAURANT).map((item) => ({
            menuItemId: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price),
          })),
        };
      }),
    );

    return contexts;
  },
};
