import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { db, type DbOrTx } from '../db.js';
import {
  mealPin,
  menuItem,
  restaurant,
  type MealPin,
  type NewMealPin,
} from '../schema/index.js';

export type MealPinWithRefs = MealPin & {
  restaurant: { id: string; name: string };
  menuItem: { id: string; name: string; description: string | null; imageUrl: string | null };
};

export const mealPinRepository = {
  async findById(id: string): Promise<MealPin | undefined> {
    const [row] = await db.select().from(mealPin).where(eq(mealPin.id, id)).limit(1);
    return row;
  },

  /**
   * Upsert by the natural key (budget_plan_id, slot_date, meal_type_id). The
   * unique index drives the conflict target; re-pinning the same slot just
   * swaps the menu item / restaurant and refreshes priceAtPin to the current
   * menu price snapshot.
   */
  async upsert(data: NewMealPin): Promise<MealPin> {
    const [row] = await db
      .insert(mealPin)
      .values(data)
      .onConflictDoUpdate({
        target: [mealPin.budgetPlanId, mealPin.slotDate, mealPin.mealTypeId],
        set: {
          restaurantId: sql`excluded.restaurant_id`,
          menuItemId: sql`excluded.menu_item_id`,
          priceAtPin: sql`excluded.price_at_pin`,
          userId: sql`excluded.user_id`,
        },
      })
      .returning();
    if (!row) throw new Error('MealPin upsert failed');
    return row;
  },

  async delete(id: string): Promise<void> {
    const deleted = await db
      .delete(mealPin)
      .where(eq(mealPin.id, id))
      .returning({ id: mealPin.id });
    if (deleted.length === 0) throw new Error('MealPin not found');
  },

  /**
   * Delete any pin matching (budgetPlanId, slotDate, mealTypeId). Called from
   * mealChoiceService.recordChoice in the same transaction as the choice
   * insert — the choice supersedes the pin.
   */
  async deleteBySlot(
    budgetPlanId: string,
    slotDate: string,
    mealTypeId: string,
    tx?: DbOrTx,
  ): Promise<number> {
    const exec = tx ?? db;
    const deleted = await exec
      .delete(mealPin)
      .where(
        and(
          eq(mealPin.budgetPlanId, budgetPlanId),
          eq(mealPin.slotDate, slotDate),
          eq(mealPin.mealTypeId, mealTypeId),
        ),
      )
      .returning({ id: mealPin.id });
    return deleted.length;
  },

  async listByPlan(
    budgetPlanId: string,
    opts: { fromDate?: string; slotDate?: string } = {},
  ): Promise<MealPinWithRefs[]> {
    const conditions = [eq(mealPin.budgetPlanId, budgetPlanId)];
    if (opts.slotDate) {
      conditions.push(eq(mealPin.slotDate, opts.slotDate));
    } else if (opts.fromDate) {
      conditions.push(gte(mealPin.slotDate, opts.fromDate));
    }
    const rows = await db.query.mealPin.findMany({
      where: and(...conditions),
      with: {
        restaurant: { columns: { id: true, name: true } },
        menuItem: {
          columns: { id: true, name: true, description: true, imageUrl: true },
        },
      },
      orderBy: [desc(mealPin.slotDate), desc(mealPin.createdAt)],
    });
    return rows as MealPinWithRefs[];
  },

  /**
   * Aggregate the cost and count of pinned slots for a plan from `today` onwards.
   * Used by contextBuilderService.fetchBudgetState to subtract pre-allocated
   * pin spend from amountRemaining/mealsRemaining before the per-meal target
   * is recomputed.
   */
  async sumFutureForPlan(
    budgetPlanId: string,
    fromDate: string,
  ): Promise<{ totalPriceAtPin: string; count: number }> {
    const [row] = await db
      .select({
        totalPriceAtPin: sql<string>`coalesce(sum(${mealPin.priceAtPin}::numeric), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(mealPin)
      .where(and(eq(mealPin.budgetPlanId, budgetPlanId), gte(mealPin.slotDate, fromDate)));
    return {
      totalPriceAtPin: row?.totalPriceAtPin ?? '0',
      count: row?.count ?? 0,
    };
  },

  /**
   * (slotDate, mealTypeId) pairs to exclude from generation. Returned as a Map
   * keyed by slotDate so the caller can do a per-date subtract without an
   * O(n*m) loop.
   */
  async getPinnedSlotsForGeneration(
    budgetPlanId: string,
    fromDate: string,
  ): Promise<{ slotDate: string; mealTypeId: string }[]> {
    return db
      .select({ slotDate: mealPin.slotDate, mealTypeId: mealPin.mealTypeId })
      .from(mealPin)
      .where(and(eq(mealPin.budgetPlanId, budgetPlanId), gte(mealPin.slotDate, fromDate)));
  },

  /**
   * Bulk fetch pins for a given (planId, slotDate) — used by
   * mealPlanService.getSuggestionsForDay to merge pins over the AI's
   * suggestion grid before returning the day view to the FE.
   */
  async getPinsForDay(budgetPlanId: string, slotDate: string): Promise<MealPinWithRefs[]> {
    const rows = await db.query.mealPin.findMany({
      where: and(eq(mealPin.budgetPlanId, budgetPlanId), eq(mealPin.slotDate, slotDate)),
      with: {
        restaurant: { columns: { id: true, name: true } },
        menuItem: {
          columns: { id: true, name: true, description: true, imageUrl: true },
        },
      },
    });
    return rows as MealPinWithRefs[];
  },

  /**
   * Read the current price for a menu item — used by the create endpoint to
   * snapshot priceAtPin server-side without trusting client-supplied values.
   */
  async getCurrentMenuItemPrice(
    menuItemId: string,
  ): Promise<{ price: string; restaurantId: string } | undefined> {
    const [row] = await db
      .select({ price: menuItem.price, restaurantId: menuItem.restaurantId })
      .from(menuItem)
      .where(eq(menuItem.id, menuItemId))
      .limit(1);
    return row;
  },

  /**
   * Convenience: get the menu item's restaurant id and the restaurant's name —
   * used to populate downstream snapshot fields like mealChoice.restaurantName
   * when a pin is converted into a choice.
   */
  async getMenuItemContext(menuItemId: string): Promise<
    | {
        price: string;
        restaurantId: string;
        restaurantName: string;
      }
    | undefined
  > {
    const [row] = await db
      .select({
        price: menuItem.price,
        restaurantId: menuItem.restaurantId,
        restaurantName: restaurant.name,
      })
      .from(menuItem)
      .innerJoin(restaurant, eq(menuItem.restaurantId, restaurant.id))
      .where(eq(menuItem.id, menuItemId))
      .limit(1);
    return row;
  },
};
