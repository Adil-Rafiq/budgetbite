import { type SQL, eq, getTableName, gte, isNull, lt, sql } from 'drizzle-orm';

import { db } from '../db.js';
import {
  budgetPlan,
  mealPlanGeneration,
  menuItem,
  restaurant,
  user,
  userProfile,
} from '../schema/index.js';

const SAMPLE_LIMIT = 50;
const STALE_DAYS = 30;

/**
 * How many restaurants the coverage map will draw before it gives up and says
 * so. Well past the current catalogue; the cap exists so that a runaway scraper
 * cannot turn one admin page load into a multi-megabyte response.
 */
const MAP_PIN_LIMIT = 5000;

/**
 * Grid resolution for the user-density overlay, in degrees. ~2.2 km on a side
 * at Pakistan's latitudes.
 *
 * This and `MIN_CELL_COUNT` are privacy invariants, not tuning knobs, which is
 * why they are constants here rather than env vars: a deployment that could
 * quietly set the cell to 0.0001° and the minimum to 1 would be shipping exact
 * home coordinates through an endpoint documented as aggregate-only.
 */
export const DENSITY_CELL_DEGREES = 0.02;

/**
 * The k in k-anonymity. A cell holding fewer users than this is dropped in SQL
 * — not filtered in the service, and not merely hidden by the UI — so sparse
 * coordinates never leave the database at all.
 *
 * 2.2 km alone is not anonymity: in a thinly-populated cell it is a street. At
 * least three people in that cell is what makes the square uninformative about
 * any one of them.
 */
export const MIN_CELL_COUNT = 3;

type Entity = { id: string; name: string; restaurantId?: string; restaurantName?: string };
type Group = { count: number; sample: Entity[] };

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
          // Joined to the parent restaurant so each sampled item carries a
          // route to the screen that can actually fix it. A dish name alone
          // was unactionable: there is no menu-item search in the admin.
          const sample = await db
            .select({
              id: menuItem.id,
              name: menuItem.name,
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            })
            .from(menuItem)
            .innerJoin(restaurant, eq(menuItem.restaurantId, restaurant.id))
            .where(invalidPriceExpr)
            .orderBy(restaurant.name, menuItem.name)
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

  /**
   * Everything the admin coverage map draws: restaurant pins with the facts the
   * defect filters need, and user locations reduced to a k-anonymised grid.
   *
   * The two halves are deliberately asymmetric. Restaurants are business
   * records and come back individually, with an id that routes to the screen
   * that can edit them. Users come back as counts per grid square and nothing
   * else — no id, no name, no coordinate — because the operational question is
   * "where is demand relative to supply", and that question never needed to
   * know where any particular person lives.
   */
  async coverage() {
    const cell = DENSITY_CELL_DEGREES;

    // Drizzle's `sql` template strips table qualifiers from column refs, so a
    // bare `${restaurant.id}` inside the subquery below would render as `"id"`
    // and bind to `menu_item.id`. Build the qualified outer reference by hand
    // so the correlation actually fires — same workaround as
    // `restaurantRepository.list`.
    const outerRestaurantId = sql.raw(`"${getTableName(restaurant)}"."id"`);

    const [pins, totals, cells, userTotals] = await Promise.all([
      db
        .select({
          id: restaurant.id,
          name: restaurant.name,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          source: restaurant.source,
          rating: restaurant.rating,
          updatedAt: restaurant.updatedAt,
          menuItemCount: sql<number>`(
            SELECT count(*)::int FROM ${menuItem}
            WHERE ${menuItem.restaurantId} = ${outerRestaurantId}
          )`.as('menu_item_count'),
        })
        .from(restaurant)
        .orderBy(restaurant.name)
        .limit(MAP_PIN_LIMIT),

      db.select({ total: sql<number>`count(*)::int` }).from(restaurant),

      // Bin, then suppress, both in SQL. `floor(x / cell) * cell` gives the
      // south-west corner of the square a point falls in; HAVING drops the
      // squares too sparse to be anonymous before the rows are ever returned.
      //
      // `GROUP BY 1, 2` by ordinal, not by repeating the expressions. Drizzle
      // binds each `${cell}` as its own placeholder, so a repeated expression
      // arrives as `floor(lat / $1)` in the projection and `floor(lat / $5)` in
      // the grouping — Postgres compares parsed trees, two Params with
      // different ids are not equal, and it rejects the whole query with
      // "column must appear in the GROUP BY clause". Ordinals cannot drift.
      db
        .select({
          lat: sql<string>`(floor(${userProfile.latitude} / ${cell}) * ${cell})::text`,
          lng: sql<string>`(floor(${userProfile.longitude} / ${cell}) * ${cell})::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(userProfile)
        .where(sql`${userProfile.latitude} IS NOT NULL AND ${userProfile.longitude} IS NOT NULL`)
        .groupBy(sql`1`, sql`2`)
        .having(sql`count(*) >= ${MIN_CELL_COUNT}`),

      db
        .select({
          total: sql<number>`count(*)::int`,
          withLocation: sql<number>`count(${userProfile.userId})::int`,
        })
        .from(user)
        .leftJoin(
          userProfile,
          sql`${userProfile.userId} = ${user.id}
              AND ${userProfile.latitude} IS NOT NULL
              AND ${userProfile.longitude} IS NOT NULL`,
        ),
    ]);

    return {
      pins,
      restaurantsTotal: totals[0]?.total ?? 0,
      pinLimit: MAP_PIN_LIMIT,
      // Carried so the map's "stale" filter and the data-quality report cannot
      // disagree about what stale means. Two screens naming the same defect
      // with two different cutoffs is worse than either cutoff being wrong.
      staleDays: STALE_DAYS,
      cells: cells.map((c) => ({ lat: Number(c.lat), lng: Number(c.lng), count: c.count })),
      cellDegrees: cell,
      minCellCount: MIN_CELL_COUNT,
      userTotal: userTotals[0]?.total ?? 0,
      usersWithLocation: userTotals[0]?.withLocation ?? 0,
    };
  },
};
