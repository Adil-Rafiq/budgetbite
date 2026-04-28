import { eq, and, asc, desc } from 'drizzle-orm';

import { db, type DbOrTx } from '../db.js';
import {
  mealPlanGeneration,
  mealSuggestion,
  menuItem,
  type MealPlanGeneration,
  type MealSuggestion,
  type NewMealSuggestion,
} from '../schema/index.js';

export const mealPlanRepository = {
  /**
   * Create a new meal plan generation record for a budget plan.
   * Generation record connects the meal suggestions to the budget plan and allows tracking multiple generations over time.
   */
  async createGeneration(budgetPlanId: string, tx?: DbOrTx): Promise<MealPlanGeneration> {
    const exec = tx ?? db;
    const [inserted] = await exec.insert(mealPlanGeneration).values({ budgetPlanId }).returning();

    if (!inserted) throw new Error('MealPlanGeneration insert failed');
    return inserted;
  },

  async getLatestGenerationId(budgetPlanId: string): Promise<string | undefined> {
    const [row] = await db
      .select({ id: mealPlanGeneration.id })
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.budgetPlanId, budgetPlanId))
      .orderBy(desc(mealPlanGeneration.generatedAt))
      .limit(1);
    return row?.id;
  },

  async getSuggestionsForSlot(
    generationId: string,
    slotDate: string,
    mealTypeId: string,
  ): Promise<
    (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[]
  > {
    const rows = await db.query.mealSuggestion.findMany({
      columns: {
        id: true,
        generationId: true,
        slotDate: true,
        mealTypeId: true,
        optionIndex: true,
        restaurantId: true,
        menuItemId: true,
        estimatedPrice: true,
        notes: true,
      },
      with: {
        restaurant: {
          columns: { id: true, name: true },
        },
        menuItem: {
          columns: { id: true, name: true, price: true, description: true },
        },
        mealType: {
          columns: { key: true, label: true },
        },
      },
      where: and(
        eq(mealSuggestion.generationId, generationId),
        eq(mealSuggestion.slotDate, slotDate),
        eq(mealSuggestion.mealTypeId, mealTypeId),
      ),
      orderBy: asc(mealSuggestion.optionIndex),
    });

    return rows as (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[];
  },

  async getSuggestionsForDay(
    generationId: string,
    slotDate: string,
  ): Promise<
    (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[]
  > {
    const rows = await db.query.mealSuggestion.findMany({
      columns: {
        id: true,
        generationId: true,
        slotDate: true,
        mealTypeId: true,
        optionIndex: true,
        restaurantId: true,
        menuItemId: true,
        estimatedPrice: true,
        notes: true,
      },
      with: {
        restaurant: {
          columns: { id: true, name: true },
        },
        menuItem: {
          columns: { id: true, name: true, price: true, description: true },
        },
        mealType: {
          columns: { key: true, label: true },
        },
      },
      where: and(
        eq(mealSuggestion.generationId, generationId),
        eq(mealSuggestion.slotDate, slotDate),
      ),
      orderBy: [asc(mealSuggestion.mealTypeId), asc(mealSuggestion.optionIndex)],
    });

    return rows as (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[];
  },

  // ─── AI methods ────────────────────────────────────────────────────────────

  /**
   * Bulk insert all suggestion rows for a generation.
   * Called by MealPlannerService after the LLM returns a valid plan.
   */
  async insertSuggestions(suggestions: NewMealSuggestion[], tx?: DbOrTx): Promise<void> {
    if (suggestions.length === 0) return;
    const exec = tx ?? db;
    await exec.insert(mealSuggestion).values(suggestions);
  },

  /**
   * Get the latest generation record (not just id) for a plan.
   * Used by the suggestions route to return the generationId alongside data.
   */
  async getLatestGeneration(budgetPlanId: string): Promise<MealPlanGeneration | undefined> {
    const [row] = await db
      .select()
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.budgetPlanId, budgetPlanId))
      .orderBy(desc(mealPlanGeneration.generatedAt))
      .limit(1);
    return row;
  },

  /**
   * Get all suggestions for a generation, optionally filtered by date.
   * Groups naturally when the caller iterates — no in-DB grouping needed.
   */
  async getSuggestionsForGeneration(
    generationId: string,
    slotDate?: string,
  ): Promise<
    (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[]
  > {
    const conditions = [eq(mealSuggestion.generationId, generationId)];
    if (slotDate) conditions.push(eq(mealSuggestion.slotDate, slotDate));

    const rows = await db.query.mealSuggestion.findMany({
      columns: {
        id: true,
        generationId: true,
        slotDate: true,
        mealTypeId: true,
        optionIndex: true,
        restaurantId: true,
        menuItemId: true,
        estimatedPrice: true,
        notes: true,
      },
      with: {
        restaurant: {
          columns: { id: true, name: true },
        },
        menuItem: {
          columns: { id: true, name: true, price: true, description: true },
        },
        mealType: {
          columns: { key: true, label: true },
        },
      },
      where: and(...conditions),
      orderBy: [
        asc(mealSuggestion.slotDate),
        asc(mealSuggestion.mealTypeId),
        asc(mealSuggestion.optionIndex),
      ],
    });

    return rows as (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[];
  },

  /**
   * Get a single suggestion by id with its menu item name.
   * Used by PreferenceService to resolve the item name from a confirmed choice.
   */
  async getSuggestionWithItem(suggestionId: string): Promise<{ menuItemName: string } | undefined> {
    const [row] = await db
      .select({ menuItemName: menuItem.name })
      .from(mealSuggestion)
      .innerJoin(menuItem, eq(mealSuggestion.menuItemId, menuItem.id))
      .where(eq(mealSuggestion.id, suggestionId))
      .limit(1);
    return row;
  },
};
