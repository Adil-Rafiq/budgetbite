import { sql, and, gte, eq } from 'drizzle-orm';

import { db } from '../db.js';
import { restaurant, type NewRestaurant, type Restaurant } from '../schema/index.js';

const haversineFragment = (userLat: number, userLng: number) =>
  sql<number>`(
    6371 * acos(
      cos(radians(${userLat})) * cos(radians(${restaurant.latitude}::numeric)) *
      cos(radians(${restaurant.longitude}::numeric) - radians(${userLng})) +
      sin(radians(${userLat})) * sin(radians(${restaurant.latitude}::numeric))
    )
  )`;

export interface ListRestaurantsFilters {
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}

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

  async list(
    filters: ListRestaurantsFilters = {},
  ): Promise<{ restaurant: Restaurant; distanceKm?: number }[]> {
    const { maxDistanceKm, userLat, userLng, minRating, limit = 50, offset = 0 } = filters;

    const distanceExpr =
      userLat != null && userLng != null ? haversineFragment(userLat, userLng) : null;
    const conditions = [];
    if (minRating != null) conditions.push(gte(restaurant.rating, String(minRating)));
    if (maxDistanceKm != null && distanceExpr)
      conditions.push(sql`${distanceExpr} <= ${maxDistanceKm}`);

    const orderBy = distanceExpr ? sql`${distanceExpr}` : restaurant.name;

    const base = db
      .select({
        restaurant: restaurant,
        ...(distanceExpr && { distanceKm: sql<number>`${distanceExpr}`.as('distance_km') }),
      })
      .from(restaurant);
    const result =
      conditions.length > 0
        ? await base
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset)
        : await base.orderBy(orderBy).limit(limit).offset(offset);

    return result as { restaurant: Restaurant; distanceKm?: number }[];
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
