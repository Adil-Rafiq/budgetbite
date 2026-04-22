import {
  restaurantRepository,
  menuRepository,
  budgetPlanRepository,
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
    const [plan, budgetState, preferences, remainingDates] = await Promise.all([
      this.fetchPlanMeta(budgetPlanId),
      this.fetchBudgetState(budgetPlanId),
      this.fetchUserPreferences(userId),
      this.fetchRemainingDates(budgetPlanId),
    ]);

    const userProfile = await this.fetchUserLocation(userId);
    const restaurants = userProfile
      ? await this.fetchNearbyRestaurants(
          userProfile.latitude,
          userProfile.longitude,
          preferences.dislikedRestaurantIds,
        )
      : [];

    return { plan, budget: budgetState, preferences, restaurants, remainingDates };
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

  async fetchBudgetState(budgetPlanId: string): Promise<BudgetStateContext> {
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
