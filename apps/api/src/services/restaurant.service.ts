import type {
  ListRestaurantsQuery,
  ListRestaurantMapQuery,
  CreateRestaurantInput,
  RestaurantMap,
  UpdateRestaurantInput,
  CreateMenuItemInput,
  ListMenuQuery,
  MenuFacets,
  UpdateMenuItemInput,
} from '@repo/shared';
import { toNumberOrNull, UNCATEGORIZED } from '@repo/shared';
import {
  budgetPlanRepository,
  mealPinRepository,
  menuRepository,
  planContextRepository,
  restaurantRepository,
  userRepository,
} from '@repo/database';
import { AppError } from '../middleware/error.middleware.js';
import { applyPinAdjustment } from '../lib/plan-math.js';
import { auditService } from './audit.service.js';
import type { AuditActor } from '../lib/audit-actor.js';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolve the per-meal target used by the "best for budget" sort. Reads the
 * caller's active plan + plan_context, applies the same pin adjustment the AI
 * sees so list-page sort and detail-page fit-badges agree on the target.
 * Returns null when the user has no active plan or no remaining meals.
 */
async function resolveBudgetFitTarget(userId?: string): Promise<number | null> {
  if (!userId) return null;
  const plan = await budgetPlanRepository.findActiveByUserId(userId);
  if (!plan) return null;
  const ctx = await planContextRepository.findByPlanId(plan.id);
  if (!ctx) return null;
  const raw = {
    totalBudget: Number(ctx.totalBudget),
    amountSpent: Number(ctx.amountSpent),
    amountRemaining: Number(ctx.amountRemaining),
    totalMeals: ctx.totalMeals,
    mealsConsumed: ctx.mealsConsumed,
    mealsRemaining: ctx.mealsRemaining,
    avgBudgetPerRemainingMeal: Number(ctx.avgBudgetPerRemainingMeal),
    cumulativeVariance: Number(ctx.cumulativeVariance),
  };
  const pinAggregate = await mealPinRepository.sumFutureForPlan(plan.id, todayDateString());
  const adjusted = applyPinAdjustment(
    raw,
    Number(pinAggregate.totalPriceAtPin),
    pinAggregate.count,
  );
  return adjusted.avgBudgetPerRemainingMeal > 0 ? adjusted.avgBudgetPerRemainingMeal : null;
}

/**
 * The coordinates to measure distance from: whatever the caller passed, else
 * the logged-in user's saved profile location.
 *
 * Shared by the list and the map so the two cannot disagree about where the
 * user is — a map whose distance filter measured from a different origin than
 * the list's would drop pins the list had just shown.
 */
async function resolveOrigin(
  query: { userLat?: number; userLng?: number },
  userId?: string,
): Promise<{ lat?: number; lng?: number }> {
  let lat = query.userLat;
  let lng = query.userLng;
  // Controllers stay out of data access, so the profile lookup lives here.
  if (userId && (lat == null || lng == null)) {
    const profile = await userRepository.findProfileByUserId(userId);
    if (profile?.latitude != null && profile?.longitude != null) {
      lat = lat ?? Number(profile.latitude);
      lng = lng ?? Number(profile.longitude);
    }
  }
  return { lat, lng };
}

/**
 * How many pins one map request will return.
 *
 * The list endpoint's `paginationSchema` caps a page at 100, which a map cannot
 * use: pins 1–100 of 400 is a map of an arbitrary quarter of the city, and
 * unlike a list there is no "next page" affordance that would make the omission
 * legible. So the map gets its own, much higher cap — and reports when it hits
 * it rather than silently drawing a subset.
 */
const MAP_PIN_CAP = 500;

export const restaurantService = {
  async list(query: ListRestaurantsQuery, userId?: string) {
    const { lat, lng } = await resolveOrigin(query, userId);

    // budget-fit sort needs the active plan's per-meal target. Compute it
    // only when the caller actually asked for that sort to avoid the extra
    // query on every list call.
    const budgetFitTarget =
      query.sort === 'budget-fit' ? await resolveBudgetFitTarget(userId) : null;

    const baseFilters = {
      maxDistanceKm: query.maxDistanceKm,
      userLat: lat,
      userLng: lng,
      minRating: query.minRating,
      q: query.q,
    };

    const [results, total] = await Promise.all([
      restaurantRepository.list({
        ...baseFilters,
        limit: query.limit,
        offset: query.offset,
        sort: query.sort,
        budgetFitTarget: budgetFitTarget ?? undefined,
      }),
      restaurantRepository.count(baseFilters),
    ]);

    return {
      data: results.map((r) => ({
        ...r.restaurant,
        latitude: r.restaurant.latitude != null ? Number(r.restaurant.latitude) : null,
        longitude: r.restaurant.longitude != null ? Number(r.restaurant.longitude) : null,
        deliveryFee: r.restaurant.deliveryFee != null ? Number(r.restaurant.deliveryFee) : null,
        minimumOrder: r.restaurant.minimumOrder != null ? Number(r.restaurant.minimumOrder) : null,
        rating: r.restaurant.rating != null ? Number(r.restaurant.rating) : null,
        distanceKm: r.distanceKm != null ? Number(r.distanceKm) : undefined,
        minItemPrice: r.minItemPrice,
        avgItemPrice: r.avgItemPrice,
        pricesUpdatedAt: r.pricesUpdatedAt,
      })),
      meta: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  },

  /**
   * The same filtered set as `list`, as map pins.
   *
   * Runs the identical repository query — same filters, same distance
   * expression — so the map and the list are two drawings of one result set
   * rather than two queries that happen to look alike. What differs is the
   * projection: a pin drops the image, order URL, slug and timestamps it will
   * never render, which is what makes 500 of them cheaper on the wire than 24
   * full rows.
   *
   * Sorting is deliberately left at the repository default. Order is meaningless
   * to a map — every pin is drawn at once — and asking for `budget-fit` would
   * cost the plan-context lookup for nothing.
   */
  async mapPins(query: ListRestaurantMapQuery, userId?: string): Promise<RestaurantMap> {
    const { lat, lng } = await resolveOrigin(query, userId);

    const filters = {
      maxDistanceKm: query.maxDistanceKm,
      userLat: lat,
      userLng: lng,
      minRating: query.minRating,
      q: query.q,
    };

    const [results, total] = await Promise.all([
      restaurantRepository.list({ ...filters, limit: MAP_PIN_CAP, offset: 0 }),
      restaurantRepository.count(filters),
    ]);

    return {
      data: results.map((r) => ({
        id: r.restaurant.id,
        name: r.restaurant.name,
        latitude: Number(r.restaurant.latitude),
        longitude: Number(r.restaurant.longitude),
        rating: r.restaurant.rating != null ? Number(r.restaurant.rating) : null,
        ratingCount: r.restaurant.ratingCount,
        distanceKm: r.distanceKm != null ? Number(r.distanceKm) : undefined,
        minItemPrice: r.minItemPrice,
        avgItemPrice: r.avgItemPrice,
        deliveryFee: r.restaurant.deliveryFee != null ? Number(r.restaurant.deliveryFee) : null,
        minimumOrder: r.restaurant.minimumOrder != null ? Number(r.restaurant.minimumOrder) : null,
      })),
      total,
      truncated: total > MAP_PIN_CAP,
    };
  },

  async getById(id: string) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    return this.toRestaurantResponse(restaurant);
  },

  /** For admin/scraper: get restaurant by externalId (e.g. after 409 on create). */
  async getByExternalId(externalId: string) {
    const restaurant = await restaurantRepository.findByExternalId(externalId);
    if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    return this.toRestaurantResponse(restaurant);
  },

  /**
   * The whole menu in one response. Kept for the admin editor, which edits rows
   * in place and genuinely needs all of them. Public callers use `listMenu`.
   */
  async getMenu(restaurantId: string) {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    const items = await menuRepository.findByRestaurantId(restaurantId);
    return items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));
  },

  /** One filtered, sorted page of a restaurant's menu. */
  async listMenu(restaurantId: string, query: ListMenuQuery) {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');

    // `uncategorized` is a sentinel, not a category name: it selects the rows
    // whose category is NULL, which no `WHERE category = ...` can ever match.
    const wantsUncategorized = query.category === UNCATEGORIZED;

    const { rows, total } = await menuRepository.findPage(restaurantId, {
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      q: query.q,
      maxPrice: query.maxPrice,
      category: wantsUncategorized ? undefined : query.category,
      categoryIsNull: wantsUncategorized,
    });

    return {
      data: rows.map((item) => ({ ...item, price: Number(item.price) })),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  /** Menu-wide totals and the section list, unaffected by page filters. */
  async getMenuFacets(restaurantId: string): Promise<MenuFacets> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');

    const facets = await menuRepository.facets(restaurantId);
    return {
      count: facets.count,
      minPrice: toNumberOrNull(facets.minPrice),
      maxPrice: toNumberOrNull(facets.maxPrice),
      avgPrice: toNumberOrNull(facets.avgPrice),
      pricesUpdatedAt: facets.pricesUpdatedAt,
      categories: facets.categories,
    };
  },

  // Admin / scraper: create, update, delete restaurants and menu items
  async createRestaurant(input: CreateRestaurantInput, actor: AuditActor) {
    // externalId is only meaningful for Foodpanda rows; generic/community
    // restaurants have none. Only dedupe when one was supplied.
    if (input.externalId) {
      const existing = await restaurantRepository.findByExternalId(input.externalId);
      if (existing)
        throw new AppError(409, 'Restaurant with this externalId already exists', 'CONFLICT');
    }
    const restaurant = await restaurantRepository.create({
      externalId: input.externalId ?? null,
      source: input.source ?? (input.externalId ? 'foodpanda' : 'community'),
      name: input.name,
      slug: input.slug ?? null,
      phone: input.phone ?? null,
      orderUrl: input.orderUrl ?? null,
      imageUrl: input.imageUrl ?? null,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      deliveryFee: input.deliveryFee != null ? String(input.deliveryFee) : null,
      minimumOrder: input.minimumOrder != null ? String(input.minimumOrder) : null,
      rating: input.rating != null ? String(input.rating) : null,
      ratingCount: input.ratingCount ?? 0,
    });
    await auditService.record({
      actor,
      action: 'restaurant.create',
      entityType: 'restaurant',
      entityId: restaurant.id,
      metadata: { name: restaurant.name, externalId: restaurant.externalId },
    });
    return this.toRestaurantResponse(restaurant);
  },

  async updateRestaurant(id: string, input: UpdateRestaurantInput, actor: AuditActor) {
    const existing = await restaurantRepository.findById(id);
    if (!existing) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    if (input.externalId !== undefined) {
      const byExternal = await restaurantRepository.findByExternalId(input.externalId);
      if (byExternal && byExternal.id !== id)
        throw new AppError(409, 'Another restaurant has this externalId', 'CONFLICT');
    }
    const restaurant = await restaurantRepository.update(id, {
      ...(input.externalId !== undefined && { externalId: input.externalId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.orderUrl !== undefined && { orderUrl: input.orderUrl }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.latitude !== undefined && { latitude: String(input.latitude) }),
      ...(input.longitude !== undefined && { longitude: String(input.longitude) }),
      ...(input.deliveryFee !== undefined && { deliveryFee: String(input.deliveryFee) }),
      ...(input.minimumOrder !== undefined && { minimumOrder: String(input.minimumOrder) }),
      ...(input.rating !== undefined && { rating: String(input.rating) }),
      ...(input.ratingCount !== undefined && { ratingCount: input.ratingCount }),
    });
    await auditService.record({
      actor,
      action: 'restaurant.update',
      entityType: 'restaurant',
      entityId: id,
      metadata: { name: restaurant.name },
    });
    return this.toRestaurantResponse(restaurant);
  },

  async deleteRestaurant(id: string, actor: AuditActor): Promise<void> {
    const existing = await restaurantRepository.findById(id);
    if (!existing) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    await restaurantRepository.delete(id);
    await auditService.record({
      actor,
      action: 'restaurant.delete',
      entityType: 'restaurant',
      entityId: id,
      metadata: { name: existing.name },
    });
  },

  async createMenuItems(
    restaurantId: string,
    input: CreateMenuItemInput | CreateMenuItemInput[],
    actor: AuditActor,
  ) {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    const items = Array.isArray(input) ? input : [input];
    // remove duplicates first
    const dedupedItems = this.dedupeMenuItems(restaurant.id, items);
    const created = await menuRepository.createMany(
      dedupedItems.map((item) => ({
        restaurantId,
        name: item.name,
        description: item.description ?? null,
        price: String(item.price),
        imageUrl: item.imageUrl ?? null,
        category: item.category ?? null,
      })),
    );
    await auditService.record({
      actor,
      action: 'menu-item.create',
      entityType: 'menu-item',
      entityId: restaurantId,
      metadata: { restaurantId, count: created.length },
    });
    return created.map((item) => ({ ...item, price: Number(item.price) }));
  },

  async updateMenuItem(
    restaurantId: string,
    itemId: string,
    input: UpdateMenuItemInput,
    actor: AuditActor,
  ) {
    const item = await menuRepository.findById(itemId);
    if (!item) throw new AppError(404, 'Menu item not found', 'NOT_FOUND');
    if (item.restaurantId !== restaurantId)
      throw new AppError(400, 'Menu item does not belong to this restaurant', 'BAD_REQUEST');
    const updated = await menuRepository.update(itemId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: String(input.price) }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      // An admin clearing the field means "this item has no section", which is
      // the column's null — the create schema strips empty strings, so an
      // explicit undefined is the only way to leave it untouched.
      ...(input.category !== undefined && { category: input.category ?? null }),
    });
    await auditService.record({
      actor,
      action: 'menu-item.update',
      entityType: 'menu-item',
      entityId: itemId,
      metadata: { restaurantId, name: updated.name },
    });
    return { ...updated, price: Number(updated.price) };
  },

  async deleteMenuItem(restaurantId: string, itemId: string, actor: AuditActor): Promise<void> {
    const item = await menuRepository.findById(itemId);
    if (!item) throw new AppError(404, 'Menu item not found', 'NOT_FOUND');
    if (item.restaurantId !== restaurantId)
      throw new AppError(400, 'Menu item does not belong to this restaurant', 'BAD_REQUEST');
    await menuRepository.delete(itemId);
    await auditService.record({
      actor,
      action: 'menu-item.delete',
      entityType: 'menu-item',
      entityId: itemId,
      metadata: { restaurantId, name: item.name },
    });
  },

  toRestaurantResponse(restaurant: {
    id: string;
    externalId: string | null;
    source: string;
    name: string;
    slug: string | null;
    phone: string | null;
    orderUrl: string | null;
    imageUrl: string | null;
    latitude: string;
    longitude: string;
    deliveryFee: string | null;
    minimumOrder: string | null;
    rating: string | null;
    ratingCount: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: restaurant.id,
      externalId: restaurant.externalId,
      source: restaurant.source as 'foodpanda' | 'community',
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.phone,
      orderUrl: restaurant.orderUrl,
      imageUrl: restaurant.imageUrl,
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude),
      deliveryFee: restaurant.deliveryFee != null ? Number(restaurant.deliveryFee) : null,
      minimumOrder: restaurant.minimumOrder != null ? Number(restaurant.minimumOrder) : null,
      rating: restaurant.rating != null ? Number(restaurant.rating) : null,
      ratingCount: restaurant.ratingCount,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  },

  dedupeMenuItems(restaurantId: string, items: CreateMenuItemInput[]) {
    const map = new Map<string, CreateMenuItemInput>();

    for (const item of items) {
      const key = `${restaurantId}-${item.name.trim().toLowerCase()}`;
      map.set(key, {
        ...item,
        name: item.name.trim(),
      });
    }

    return Array.from(map.values());
  },
};
