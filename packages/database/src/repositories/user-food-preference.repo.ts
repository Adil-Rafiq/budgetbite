import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import { userFoodPreference, type UserFoodPreference } from '../schema/index.js';

export type FoodPreferenceSentiment = 'favorite' | 'blocked';

export type FoodPreferenceWithRefs = UserFoodPreference & {
  restaurant: { id: string; name: string } | null;
  menuItem:
    | ({
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        restaurantId: string;
      } & { restaurant: { id: string; name: string } })
    | null;
};

/**
 * Grouped id sets the context builder injects into the planner: blocked ids are
 * hard exclusions, favorite ids are soft biases flagged on the nearby context.
 */
export interface PlannerFoodSignals {
  blockedRestaurantIds: string[];
  blockedMenuItemIds: string[];
  favoriteRestaurantIds: string[];
  favoriteMenuItemIds: string[];
}

const withRefsShape = {
  restaurant: { columns: { id: true, name: true } },
  menuItem: {
    columns: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      restaurantId: true,
    },
    with: { restaurant: { columns: { id: true, name: true } } },
  },
} as const;

export const userFoodPreferenceRepository = {
  async list(userId: string): Promise<FoodPreferenceWithRefs[]> {
    const rows = await db.query.userFoodPreference.findMany({
      where: eq(userFoodPreference.userId, userId),
      with: withRefsShape,
      orderBy: [desc(userFoodPreference.createdAt)],
    });
    return rows as FoodPreferenceWithRefs[];
  },

  async findById(id: string): Promise<UserFoodPreference | undefined> {
    const [row] = await db
      .select()
      .from(userFoodPreference)
      .where(eq(userFoodPreference.id, id))
      .limit(1);
    return row;
  },

  async getWithRefs(id: string): Promise<FoodPreferenceWithRefs | undefined> {
    const row = await db.query.userFoodPreference.findFirst({
      where: eq(userFoodPreference.id, id),
      with: withRefsShape,
    });
    return row as FoodPreferenceWithRefs | undefined;
  },

  /**
   * Upsert by the natural key. Exactly one of restaurantId / menuItemId must be
   * set; the matching partial unique index drives the conflict target so
   * re-preferencing the same target just flips its sentiment.
   */
  async upsert(data: {
    userId: string;
    restaurantId?: string | null;
    menuItemId?: string | null;
    sentiment: FoodPreferenceSentiment;
  }): Promise<UserFoodPreference> {
    const isRestaurant = data.restaurantId != null;
    const [row] = await db
      .insert(userFoodPreference)
      .values({
        userId: data.userId,
        restaurantId: data.restaurantId ?? null,
        menuItemId: data.menuItemId ?? null,
        sentiment: data.sentiment,
      })
      .onConflictDoUpdate({
        target: isRestaurant
          ? [userFoodPreference.userId, userFoodPreference.restaurantId]
          : [userFoodPreference.userId, userFoodPreference.menuItemId],
        targetWhere: isRestaurant
          ? sql`${userFoodPreference.restaurantId} IS NOT NULL`
          : sql`${userFoodPreference.menuItemId} IS NOT NULL`,
        set: { sentiment: sql`excluded.sentiment` },
      })
      .returning();
    if (!row) throw new Error('UserFoodPreference upsert failed');
    return row;
  },

  async deleteById(id: string): Promise<void> {
    const deleted = await db
      .delete(userFoodPreference)
      .where(eq(userFoodPreference.id, id))
      .returning({ id: userFoodPreference.id });
    if (deleted.length === 0) throw new Error('UserFoodPreference not found');
  },

  /** Delete by target (used when the client toggles a preference off). */
  async deleteByTarget(
    userId: string,
    target: { restaurantId?: string | null; menuItemId?: string | null },
  ): Promise<number> {
    const condition =
      target.restaurantId != null
        ? and(
            eq(userFoodPreference.userId, userId),
            eq(userFoodPreference.restaurantId, target.restaurantId),
          )
        : and(
            eq(userFoodPreference.userId, userId),
            eq(userFoodPreference.menuItemId, target.menuItemId!),
          );
    const deleted = await db
      .delete(userFoodPreference)
      .where(condition)
      .returning({ id: userFoodPreference.id });
    return deleted.length;
  },

  /**
   * All of a user's favorites/blocks reduced to id sets for the planner.
   * One round trip; grouping is done in JS.
   */
  async getPlannerSignals(userId: string): Promise<PlannerFoodSignals> {
    const rows = await db
      .select({
        restaurantId: userFoodPreference.restaurantId,
        menuItemId: userFoodPreference.menuItemId,
        sentiment: userFoodPreference.sentiment,
      })
      .from(userFoodPreference)
      .where(eq(userFoodPreference.userId, userId));

    const signals: PlannerFoodSignals = {
      blockedRestaurantIds: [],
      blockedMenuItemIds: [],
      favoriteRestaurantIds: [],
      favoriteMenuItemIds: [],
    };
    for (const row of rows) {
      if (row.restaurantId) {
        if (row.sentiment === 'blocked') signals.blockedRestaurantIds.push(row.restaurantId);
        else signals.favoriteRestaurantIds.push(row.restaurantId);
      } else if (row.menuItemId) {
        if (row.sentiment === 'blocked') signals.blockedMenuItemIds.push(row.menuItemId);
        else signals.favoriteMenuItemIds.push(row.menuItemId);
      }
    }
    return signals;
  },
};
