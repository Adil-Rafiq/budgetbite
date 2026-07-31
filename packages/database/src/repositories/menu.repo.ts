import { and, asc, count, desc, eq, ilike, isNull, lte, max, sql, type SQL } from 'drizzle-orm';

import { db } from '../db.js';
import { menuItem, type MenuItem, type NewMenuItem } from '../schema/index.js';

/** Filters accepted by the paged menu read. All optional and combinable. */
export interface MenuPageParams {
  limit: number;
  offset: number;
  /** Case-insensitive contains-match on the item name. */
  q?: string;
  /**
   * Exact category. The `uncategorized` sentinel is resolved by the caller into
   * `categoryIsNull`, because SQL equality never matches NULL.
   */
  category?: string;
  categoryIsNull?: boolean;
  /** Menu-price ceiling, inclusive. */
  maxPrice?: number;
  sort: 'default' | 'price-asc' | 'price-desc';
}

export interface MenuFacetsRow {
  count: number;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string | null;
  pricesUpdatedAt: Date | null;
  categories: { category: string | null; count: number }[];
}

/**
 * Every predicate the menu page understands, as one WHERE clause.
 *
 * Shared by the row query and the count query on purpose: a total computed
 * under different filters than the rows is how "Showing 24 of 41" ends up
 * sitting above a list that has already run out.
 */
function menuWhere(restaurantId: string, params: Partial<MenuPageParams>): SQL | undefined {
  const clauses: SQL[] = [eq(menuItem.restaurantId, restaurantId)];

  if (params.q) {
    // `%` and `_` are wildcards to ILIKE; someone searching "50% off" means the
    // characters, so they are escaped rather than passed through.
    const escaped = params.q.replace(/([\\%_])/g, '\\$1');
    clauses.push(ilike(menuItem.name, `%${escaped}%`));
  }
  if (params.categoryIsNull) clauses.push(isNull(menuItem.category));
  else if (params.category) clauses.push(eq(menuItem.category, params.category));
  // A ceiling of 0 is meaningful (nothing qualifies), so test for null rather
  // than falsiness — `maxPrice: 0` must not silently drop the filter.
  if (params.maxPrice != null) clauses.push(lte(menuItem.price, String(params.maxPrice)));

  return and(...clauses);
}

function menuOrderBy(sort: MenuPageParams['sort']): SQL[] {
  if (sort === 'price-asc') return [asc(menuItem.price), asc(menuItem.name)];
  if (sort === 'price-desc') return [desc(menuItem.price), asc(menuItem.name)];
  // The vendor's own shelf order. NULLS LAST keeps the items whose section we
  // never learned in one trailing block, instead of scattering them above every
  // named category the way plain `ASC` does in Postgres.
  return [sql`${menuItem.category} asc nulls last`, asc(menuItem.name)];
}

export const menuRepository = {
  async findById(id: string): Promise<MenuItem | undefined> {
    const [row] = await db.select().from(menuItem).where(eq(menuItem.id, id)).limit(1);
    return row;
  },

  /**
   * The whole menu, unpaged. Still used where a consumer genuinely needs every
   * row — the AI context builder, the admin editor — but no longer by the
   * public restaurant page, which pages through `findPage`.
   */
  async findByRestaurantId(restaurantId: string): Promise<MenuItem[]> {
    return db
      .select()
      .from(menuItem)
      .where(eq(menuItem.restaurantId, restaurantId))
      .orderBy(...menuOrderBy('default'));
  },

  /** One screenful of a menu, plus how many rows the same filters match. */
  async findPage(
    restaurantId: string,
    params: MenuPageParams,
  ): Promise<{ rows: MenuItem[]; total: number }> {
    const where = menuWhere(restaurantId, params);

    const [rows, [totals]] = await Promise.all([
      db
        .select()
        .from(menuItem)
        .where(where)
        .orderBy(...menuOrderBy(params.sort))
        .limit(params.limit)
        .offset(params.offset),
      db.select({ value: count() }).from(menuItem).where(where),
    ]);

    return { rows, total: totals?.value ?? 0 };
  },

  /**
   * Menu-wide aggregates and the section list.
   *
   * Deliberately ignores the page filters: these numbers describe the menu the
   * reader is filtering, so they have to hold still while they do it.
   */
  async facets(restaurantId: string): Promise<MenuFacetsRow> {
    const where = eq(menuItem.restaurantId, restaurantId);

    const [[totals], categories] = await Promise.all([
      db
        .select({
          count: count(),
          // ::text on every aggregate so the numeric round-trips as a string
          // like the column itself does, and the service coerces one way.
          minPrice: sql<string | null>`min(${menuItem.price})::text`,
          maxPrice: sql<string | null>`max(${menuItem.price})::text`,
          avgPrice: sql<string | null>`avg(${menuItem.price})::text`,
          pricesUpdatedAt: max(menuItem.updatedAt),
        })
        .from(menuItem)
        .where(where),
      db
        .select({ category: menuItem.category, count: count() })
        .from(menuItem)
        .where(where)
        .groupBy(menuItem.category)
        .orderBy(sql`${menuItem.category} asc nulls last`),
    ]);

    return {
      count: totals?.count ?? 0,
      minPrice: totals?.minPrice ?? null,
      maxPrice: totals?.maxPrice ?? null,
      avgPrice: totals?.avgPrice ?? null,
      pricesUpdatedAt: totals?.pricesUpdatedAt ?? null,
      categories,
    };
  },

  async create(data: NewMenuItem): Promise<MenuItem> {
    const [inserted] = await db
      .insert(menuItem)
      .values(data)
      .onConflictDoNothing() // silently skips duplicates
      .returning();
    if (!inserted) throw new Error('MenuItem insert failed');
    return inserted;
  },

  async createMany(data: NewMenuItem[]): Promise<MenuItem[]> {
    if (data.length === 0) return [];
    const inserted = await db
      .insert(menuItem)
      .values(data)
      .onConflictDoUpdate({
        target: [menuItem.restaurantId, menuItem.name],
        set: {
          price: sql`excluded.price`,
          description: sql`excluded.description`,
          imageUrl: sql`excluded.image_url`,
          // Keep the category already on the row when the incoming one has
          // none. A scrape whose section selectors miss — Foodpanda changes its
          // markup without notice — would otherwise wipe every category on the
          // menu and quietly flatten the page back to one long list.
          category: sql`coalesce(excluded.category, ${menuItem.category})`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return inserted;
  },

  async update(id: string, data: Partial<NewMenuItem>): Promise<MenuItem> {
    const [updated] = await db.update(menuItem).set(data).where(eq(menuItem.id, id)).returning();
    if (!updated) throw new Error('MenuItem not found');
    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await db
      .delete(menuItem)
      .where(eq(menuItem.id, id))
      .returning({ id: menuItem.id });
    if (deleted.length === 0) throw new Error('MenuItem not found');
  },
};
