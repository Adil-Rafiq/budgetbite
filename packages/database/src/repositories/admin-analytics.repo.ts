import { type SQL, eq, gte, isNull, lt, sql } from 'drizzle-orm';

import { db } from '../db.js';
import { budgetPlan, mealPlanGeneration, menuItem, restaurant, user } from '../schema/index.js';

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

  async metrics() {
    const signupCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const c = sql<number>`count(*)::int`;
    const [[users], [admins], [restaurants], [menuItems], [activePlans], [generations], [signups]] =
      await Promise.all([
        db.select({ count: c }).from(user),
        db.select({ count: c }).from(user).where(eq(user.role, 'admin')),
        db.select({ count: c }).from(restaurant),
        db.select({ count: c }).from(menuItem),
        db.select({ count: c }).from(budgetPlan).where(eq(budgetPlan.status, 'active')),
        db.select({ count: c }).from(mealPlanGeneration),
        db.select({ count: c }).from(user).where(gte(user.createdAt, signupCutoff)),
      ]);

    return {
      users: users?.count ?? 0,
      admins: admins?.count ?? 0,
      restaurants: restaurants?.count ?? 0,
      menuItems: menuItems?.count ?? 0,
      activePlans: activePlans?.count ?? 0,
      totalGenerations: generations?.count ?? 0,
      signupsLast30Days: signups?.count ?? 0,
    };
  },
};
