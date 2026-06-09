import { type SQL, isNull, lt, sql } from 'drizzle-orm';

import { db } from '../db.js';
import { menuItem, restaurant } from '../schema/index.js';

const SAMPLE_LIMIT = 50;
const STALE_DAYS = 30;

type Group = { count: number; sample: { id: string; name: string }[] };

async function restaurantGroup(where: SQL): Promise<Group> {
  const [c] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(restaurant)
    .where(where);
  const sample = await db
    .select({ id: restaurant.id, name: restaurant.name })
    .from(restaurant)
    .where(where)
    .orderBy(restaurant.name)
    .limit(SAMPLE_LIMIT);
  return { count: c?.count ?? 0, sample };
}

export const adminAnalyticsRepository = {
  async dataQuality() {
    const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

    const noItemsExpr = sql`NOT EXISTS (SELECT 1 FROM ${menuItem} WHERE ${menuItem.restaurantId} = ${restaurant.id})`;
    const invalidPriceExpr = sql`${menuItem.price}::numeric <= 0`;

    const [restaurantsWithoutItems, restaurantsWithoutRating, staleRestaurants, invalidPrice] =
      await Promise.all([
        restaurantGroup(noItemsExpr),
        restaurantGroup(isNull(restaurant.rating)),
        restaurantGroup(lt(restaurant.updatedAt, staleCutoff)),
        (async (): Promise<Group> => {
          const [c] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(menuItem)
            .where(invalidPriceExpr);
          const sample = await db
            .select({ id: menuItem.id, name: menuItem.name })
            .from(menuItem)
            .where(invalidPriceExpr)
            .limit(SAMPLE_LIMIT);
          return { count: c?.count ?? 0, sample };
        })(),
      ]);

    return {
      staleDays: STALE_DAYS,
      restaurantsWithoutItems,
      restaurantsWithoutRating,
      staleRestaurants,
      itemsInvalidPrice: invalidPrice,
    };
  },
};
