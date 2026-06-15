import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import {
  menuItem,
  restaurant,
  restaurantRecommendation,
  type NewRestaurant,
  type NewRestaurantRecommendation,
  type Restaurant,
  type RestaurantRecommendation,
  type UpdateRestaurantRecommendation,
} from '../schema/index.js';

export type RecommendationStatus = 'pending' | 'approved' | 'rejected';

export interface ListRecommendationsFilters {
  status?: RecommendationStatus;
  limit?: number;
  offset?: number;
}

export type AdminRecommendationRow = RestaurantRecommendation & {
  user: { id: string; name: string; email: string };
};

export const restaurantRecommendationRepository = {
  async create(data: NewRestaurantRecommendation): Promise<RestaurantRecommendation> {
    const [row] = await db.insert(restaurantRecommendation).values(data).returning();
    if (!row) throw new Error('Restaurant recommendation insert failed');
    return row;
  },

  async findById(id: string): Promise<RestaurantRecommendation | undefined> {
    const [row] = await db
      .select()
      .from(restaurantRecommendation)
      .where(eq(restaurantRecommendation.id, id))
      .limit(1);
    return row;
  },

  async update(
    id: string,
    data: UpdateRestaurantRecommendation,
  ): Promise<RestaurantRecommendation> {
    const [row] = await db
      .update(restaurantRecommendation)
      .set(data)
      .where(eq(restaurantRecommendation.id, id))
      .returning();
    if (!row) throw new Error('Restaurant recommendation not found');
    return row;
  },

  /** Pending count for a user — backs the per-user submission cap. */
  async countPendingByUser(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(restaurantRecommendation)
      .where(
        and(
          eq(restaurantRecommendation.userId, userId),
          eq(restaurantRecommendation.status, 'pending'),
        ),
      );
    return row?.count ?? 0;
  },

  async listByUser(
    userId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<RestaurantRecommendation[]> {
    const { limit = 20, offset = 0 } = opts;
    return db
      .select()
      .from(restaurantRecommendation)
      .where(eq(restaurantRecommendation.userId, userId))
      .orderBy(desc(restaurantRecommendation.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countByUser(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(restaurantRecommendation)
      .where(eq(restaurantRecommendation.userId, userId));
    return row?.count ?? 0;
  },

  /** Admin queue: all users' recommendations (newest first), joined with the submitter. */
  async listForAdmin(filters: ListRecommendationsFilters = {}): Promise<AdminRecommendationRow[]> {
    const { status, limit = 20, offset = 0 } = filters;
    const rows = await db.query.restaurantRecommendation.findMany({
      where: status ? eq(restaurantRecommendation.status, status) : undefined,
      orderBy: desc(restaurantRecommendation.createdAt),
      limit,
      offset,
      with: { user: { columns: { id: true, name: true, email: true } } },
    });
    return rows as AdminRecommendationRow[];
  },

  async countForAdmin(status?: RecommendationStatus): Promise<number> {
    const base = db.select({ count: sql<number>`count(*)::int` }).from(restaurantRecommendation);
    const [row] = status
      ? await base.where(eq(restaurantRecommendation.status, status))
      : await base;
    return row?.count ?? 0;
  },

  /**
   * Atomically turn an approved recommendation into a real restaurant: insert the
   * restaurant + its menu items and flip the recommendation to approved (with the
   * link back) in one transaction, so a partial failure never leaves an orphan.
   */
  async approveWithRestaurant(
    id: string,
    restaurantData: NewRestaurant,
    items: { name: string; price: string; description: string | null }[],
  ): Promise<{ restaurant: Restaurant; recommendation: RestaurantRecommendation }> {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(restaurant).values(restaurantData).returning();
      if (!created) throw new Error('Restaurant insert failed');

      if (items.length > 0) {
        await tx.insert(menuItem).values(
          items.map((i) => ({
            restaurantId: created.id,
            name: i.name,
            price: i.price,
            description: i.description,
          })),
        );
      }

      const [recommendation] = await tx
        .update(restaurantRecommendation)
        .set({ status: 'approved', createdRestaurantId: created.id, reviewedAt: new Date() })
        .where(eq(restaurantRecommendation.id, id))
        .returning();
      if (!recommendation) throw new Error('Restaurant recommendation not found');

      return { restaurant: created, recommendation };
    });
  },
};
