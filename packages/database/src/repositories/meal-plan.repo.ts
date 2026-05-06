import { eq, and, asc, desc, sql } from 'drizzle-orm';

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
   *
   * Defaults to status='pending'. Used for tests / non-kickoff callers; the real
   * AI flow uses `createGenerationSupersedingPrior` to also flip any in-flight
   * pending row for the same plan to 'superseded' atomically.
   */
  async createGeneration(budgetPlanId: string, tx?: DbOrTx): Promise<MealPlanGeneration> {
    const exec = tx ?? db;
    const [inserted] = await exec.insert(mealPlanGeneration).values({ budgetPlanId }).returning();

    if (!inserted) throw new Error('MealPlanGeneration insert failed');
    return inserted;
  },

  /**
   * Atomically supersede any in-flight pending generations for this plan and
   * insert a new pending row. This is the entry point used by the AI kickoff:
   * a newer attempt always wins, the older pending row is marked 'superseded'
   * and its eventual LLM result will be discarded by the conditional
   * `markGenerationSucceeded` / `markGenerationFailed` calls below.
   */
  async createGenerationSupersedingPrior(budgetPlanId: string): Promise<MealPlanGeneration> {
    return db.transaction(async (tx) => {
      await tx
        .update(mealPlanGeneration)
        .set({ status: 'superseded', completedAt: new Date() })
        .where(
          and(
            eq(mealPlanGeneration.budgetPlanId, budgetPlanId),
            eq(mealPlanGeneration.status, 'pending'),
          ),
        );

      const [inserted] = await tx
        .insert(mealPlanGeneration)
        .values({ budgetPlanId })
        .returning();

      if (!inserted) throw new Error('MealPlanGeneration insert failed');
      return inserted;
    });
  },

  /**
   * Conditional success marker. Only flips status to 'succeeded' if the row is
   * still 'pending' (i.e. has not been superseded mid-flight). Returns true if
   * the update applied, false otherwise. Caller (the suggestion-insert tx) must
   * roll back when this returns false so superseded gens never carry orphan
   * suggestion rows.
   */
  async markGenerationSucceeded(generationId: string, tx?: DbOrTx): Promise<boolean> {
    const exec = tx ?? db;
    const updated = await exec
      .update(mealPlanGeneration)
      .set({ status: 'succeeded', completedAt: new Date() })
      .where(
        and(eq(mealPlanGeneration.id, generationId), eq(mealPlanGeneration.status, 'pending')),
      )
      .returning({ id: mealPlanGeneration.id });
    return updated.length > 0;
  },

  /**
   * Conditional failure marker. Only flips status to 'failed' if the row is
   * still 'pending' — never overwrites a 'superseded' marker. Always its own
   * statement so it survives a rolled-back suggestion-insert tx.
   */
  async markGenerationFailed(
    generationId: string,
    errorCode: string,
    errorMessage: string | null,
  ): Promise<boolean> {
    const updated = await db
      .update(mealPlanGeneration)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorCode,
        errorMessage,
      })
      .where(
        and(eq(mealPlanGeneration.id, generationId), eq(mealPlanGeneration.status, 'pending')),
      )
      .returning({ id: mealPlanGeneration.id });
    return updated.length > 0;
  },

  /**
   * Lazy timeout: flip any 'pending' row whose generatedAt is older than
   * `cutoff` to 'failed' with errorCode='TIMEOUT'. Conditional on
   * status='pending' so it never overwrites a 'superseded' marker.
   *
   * Called from the GET path that surfaces generation status — recovers a
   * row stuck in pending after a process crash mid-LLM-call. Returns the
   * count of rows flipped.
   *
   * TODO(cron): replace with a scheduled janitor when a worker tier exists.
   */
  async failStalePending(budgetPlanId: string, cutoff: Date): Promise<number> {
    const updated = await db
      .update(mealPlanGeneration)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorCode: 'TIMEOUT',
        errorMessage: 'Generation exceeded timeout window',
      })
      .where(
        and(
          eq(mealPlanGeneration.budgetPlanId, budgetPlanId),
          eq(mealPlanGeneration.status, 'pending'),
          sql`${mealPlanGeneration.generatedAt} < ${cutoff}`,
        ),
      )
      .returning({ id: mealPlanGeneration.id });
    return updated.length;
  },

  /**
   * Latest generation **id** by generatedAt regardless of status. Used for the
   * `latestAttempt` UX signal (banners, toasts) — never for serving suggestions.
   */
  async getLatestGenerationId(budgetPlanId: string): Promise<string | undefined> {
    const [row] = await db
      .select({ id: mealPlanGeneration.id })
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.budgetPlanId, budgetPlanId))
      .orderBy(desc(mealPlanGeneration.generatedAt))
      .limit(1);
    return row?.id;
  },

  /**
   * Latest **succeeded** generation id. This is the source-of-truth pointer for
   * the suggestions read path: a pending or failed replan never empties the
   * in-place plan because we resolve through this filter.
   */
  async getLatestSucceededGenerationId(budgetPlanId: string): Promise<string | undefined> {
    const [row] = await db
      .select({ id: mealPlanGeneration.id })
      .from(mealPlanGeneration)
      .where(
        and(
          eq(mealPlanGeneration.budgetPlanId, budgetPlanId),
          eq(mealPlanGeneration.status, 'succeeded'),
        ),
      )
      .orderBy(desc(mealPlanGeneration.generatedAt))
      .limit(1);
    return row?.id;
  },

  async getLatestSucceededGeneration(
    budgetPlanId: string,
  ): Promise<MealPlanGeneration | undefined> {
    const [row] = await db
      .select()
      .from(mealPlanGeneration)
      .where(
        and(
          eq(mealPlanGeneration.budgetPlanId, budgetPlanId),
          eq(mealPlanGeneration.status, 'succeeded'),
        ),
      )
      .orderBy(desc(mealPlanGeneration.generatedAt))
      .limit(1);
    return row;
  },

  /**
   * Paginated list of every generation row for a plan ordered newest-first.
   * Drives the Generation History timeline on the FE detail page; includes
   * pending / superseded / failed rows so users can audit the full attempt log.
   */
  async listGenerations(
    budgetPlanId: string,
    { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  ): Promise<MealPlanGeneration[]> {
    return db
      .select()
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.budgetPlanId, budgetPlanId))
      .orderBy(desc(mealPlanGeneration.generatedAt))
      .limit(limit)
      .offset(offset);
  },

  async countGenerations(budgetPlanId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.budgetPlanId, budgetPlanId));
    return row?.count ?? 0;
  },

  async getGenerationById(generationId: string): Promise<MealPlanGeneration | undefined> {
    const [row] = await db
      .select()
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.id, generationId))
      .limit(1);
    return row;
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

  /**
   * Lift restaurantId / menuItemId off a suggestion. Used by the
   * record-choice flow to backfill the structured FKs on meal_choice when the
   * client only supplies suggestionId.
   */
  async getSuggestionForChoice(
    suggestionId: string,
  ): Promise<{ restaurantId: string; menuItemId: string } | undefined> {
    const [row] = await db
      .select({
        restaurantId: mealSuggestion.restaurantId,
        menuItemId: mealSuggestion.menuItemId,
      })
      .from(mealSuggestion)
      .where(eq(mealSuggestion.id, suggestionId))
      .limit(1);
    return row;
  },
};
