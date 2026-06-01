import { sql, and, eq, getTableName, gte, ilike } from 'drizzle-orm';

import { db } from '../db.js';
import { menuItem, restaurant, type NewRestaurant, type Restaurant } from '../schema/index.js';

const haversineFragment = (userLat: number, userLng: number) =>
  sql<number>`(
    6371 * acos(
      cos(radians(${userLat})) * cos(radians(${restaurant.latitude}::numeric)) *
      cos(radians(${restaurant.longitude}::numeric) - radians(${userLng})) +
      sin(radians(${userLat})) * sin(radians(${restaurant.latitude}::numeric))
    )
  )`;

export type RestaurantSort = 'distance' | 'rating' | 'budget-fit';

export interface ListRestaurantsFilters {
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
  minRating?: number;
  q?: string;
  sort?: RestaurantSort;
  /**
   * Per-meal target used when sort = 'budget-fit'. Items with avg_price <= this
   * value are bucketed first; items above it fall to the second bucket. When
   * absent, 'budget-fit' degrades to plain min_price ASC ordering.
   */
  budgetFitTarget?: number;
  limit?: number;
  offset?: number;
}

export type ListRestaurantsRow = {
  restaurant: Restaurant;
  distanceKm?: number;
  minItemPrice: number | null;
  avgItemPrice: number | null;
};

export const restaurantRepository = {
  async findById(id: string): Promise<Restaurant | undefined> {
    const [row] = await db.select().from(restaurant).where(eq(restaurant.id, id)).limit(1);
    return row;
  },

  async findByExternalId(externalId: string): Promise<Restaurant | undefined> {
    const [row] = await db
      .select()
      .from(restaurant)
      .where(eq(restaurant.externalId, externalId))
      .limit(1);
    return row;
  },

  async findByName(name: string): Promise<Restaurant | undefined> {
    const [row] = await db.select().from(restaurant).where(eq(restaurant.name, name)).limit(1);
    return row;
  },

  async list(filters: ListRestaurantsFilters = {}): Promise<ListRestaurantsRow[]> {
    const {
      maxDistanceKm,
      userLat,
      userLng,
      minRating,
      q,
      sort,
      budgetFitTarget,
      limit = 50,
      offset = 0,
    } = filters;

    const distanceExpr =
      userLat != null && userLng != null ? haversineFragment(userLat, userLng) : null;

    // Per-restaurant menu aggregates (correlated subqueries). LEFT JOIN +
    // GROUP BY would also work but the subquery shape keeps `restaurant.*`
    // cleanly typed without spelling out every column on the SELECT.
    // Drizzle's `sql` template strips table qualifiers from column refs
    // (so `${restaurant.id}` renders as just `"id"` and binds to
    // `menu_item.id` inside the subquery). Build the qualified outer ref
    // by hand so the correlation actually fires.
    const outerRestaurantId = sql.raw(`"${getTableName(restaurant)}"."id"`);
    const minPriceExpr = sql<string | null>`(
      SELECT MIN(${menuItem.price}::numeric)::text
      FROM ${menuItem}
      WHERE ${menuItem.restaurantId} = ${outerRestaurantId}
    )`;
    const avgPriceExpr = sql<string | null>`(
      SELECT AVG(${menuItem.price}::numeric)::text
      FROM ${menuItem}
      WHERE ${menuItem.restaurantId} = ${outerRestaurantId}
    )`;

    const conditions = [];
    if (minRating != null) conditions.push(gte(restaurant.rating, String(minRating)));
    if (maxDistanceKm != null && distanceExpr)
      conditions.push(sql`${distanceExpr} <= ${maxDistanceKm}`);
    if (q && q.trim().length > 0) conditions.push(ilike(restaurant.name, `%${q.trim()}%`));

    let orderByExpr: ReturnType<typeof sql> | typeof restaurant.name;
    if (sort === 'rating') {
      orderByExpr = sql`${restaurant.rating} DESC NULLS LAST, ${restaurant.name} ASC`;
    } else if (sort === 'budget-fit' && budgetFitTarget != null) {
      // Two-tier sort: restaurants whose avg item price fits the per-meal
      // target float to the top; within each tier, cheaper places win.
      orderByExpr = sql`(
        CASE WHEN ${avgPriceExpr}::numeric <= ${budgetFitTarget} THEN 0 ELSE 1 END
      ) ASC, ${minPriceExpr}::numeric ASC NULLS LAST`;
    } else if (sort === 'budget-fit') {
      orderByExpr = sql`${minPriceExpr}::numeric ASC NULLS LAST`;
    } else if (distanceExpr) {
      orderByExpr = sql`${distanceExpr}`;
    } else {
      orderByExpr = restaurant.name;
    }

    const base = db
      .select({
        restaurant,
        ...(distanceExpr && { distanceKm: sql<number>`${distanceExpr}`.as('distance_km') }),
        minItemPrice: minPriceExpr.as('min_item_price'),
        avgItemPrice: avgPriceExpr.as('avg_item_price'),
      })
      .from(restaurant);

    const rows =
      conditions.length > 0
        ? await base
            .where(and(...conditions))
            .orderBy(orderByExpr)
            .limit(limit)
            .offset(offset)
        : await base.orderBy(orderByExpr).limit(limit).offset(offset);

    return rows.map((r) => ({
      restaurant: r.restaurant,
      distanceKm: 'distanceKm' in r ? (r.distanceKm as number) : undefined,
      minItemPrice: r.minItemPrice != null ? Number(r.minItemPrice) : null,
      avgItemPrice: r.avgItemPrice != null ? Number(r.avgItemPrice) : null,
    }));
  },

  async count(
    filters: Pick<
      ListRestaurantsFilters,
      'maxDistanceKm' | 'userLat' | 'userLng' | 'minRating' | 'q'
    > = {},
  ): Promise<number> {
    const { maxDistanceKm, userLat, userLng, minRating, q } = filters;
    const distanceExpr =
      userLat != null && userLng != null ? haversineFragment(userLat, userLng) : null;
    const conditions = [];
    if (minRating != null) conditions.push(gte(restaurant.rating, String(minRating)));
    if (maxDistanceKm != null && distanceExpr)
      conditions.push(sql`${distanceExpr} <= ${maxDistanceKm}`);
    if (q && q.trim().length > 0) conditions.push(ilike(restaurant.name, `%${q.trim()}%`));
    const base = db.select({ count: sql<number>`count(*)::int` }).from(restaurant);
    const [row] = conditions.length > 0 ? await base.where(and(...conditions)) : await base;
    return row?.count ?? 0;
  },

  async create(data: NewRestaurant): Promise<Restaurant> {
    const [inserted] = await db.insert(restaurant).values(data).returning();
    if (!inserted) throw new Error('Restaurant insert failed');
    return inserted;
  },

  async update(id: string, data: Partial<NewRestaurant>): Promise<Restaurant> {
    const [updated] = await db
      .update(restaurant)
      .set(data)
      .where(eq(restaurant.id, id))
      .returning();
    if (!updated) throw new Error('Restaurant not found');
    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await db
      .delete(restaurant)
      .where(eq(restaurant.id, id))
      .returning({ id: restaurant.id });
    if (deleted.length === 0) throw new Error('Restaurant not found');
  },
};
