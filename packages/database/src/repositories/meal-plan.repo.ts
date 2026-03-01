import { eq, and, asc } from 'drizzle-orm';

import { db } from '../db.js';
import {
  mealPlanGeneration,
  mealSuggestion,
  menuItem,
  restaurant,
  mealType,
  type MealPlanGeneration,
  type MealSuggestion,
} from '../schema/index.js';

export const mealPlanRepository = {
  async createGeneration(budgetPlanId: string): Promise<MealPlanGeneration> {
    const [inserted] = await db.insert(mealPlanGeneration).values({ budgetPlanId }).returning();

    if (!inserted) throw new Error('MealPlanGeneration insert failed');
    return inserted;
  },

  async getLatestGenerationId(budgetPlanId: string): Promise<string | undefined> {
    const [row] = await db
      .select({ id: mealPlanGeneration.id })
      .from(mealPlanGeneration)
      .where(eq(mealPlanGeneration.budgetPlanId, budgetPlanId))
      .orderBy(mealPlanGeneration.generatedAt)
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
    return db
      .select({
        id: mealSuggestion.id,
        generationId: mealSuggestion.generationId,
        slotDate: mealSuggestion.slotDate,
        mealTypeId: mealSuggestion.mealTypeId,
        optionIndex: mealSuggestion.optionIndex,
        restaurantId: mealSuggestion.restaurantId,
        menuItemId: mealSuggestion.menuItemId,
        estimatedPrice: mealSuggestion.estimatedPrice,
        notes: mealSuggestion.notes,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
        },
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          description: menuItem.description,
        },
        mealType: {
          key: mealType.key,
          label: mealType.label,
        },
      })
      .from(mealSuggestion)
      .innerJoin(restaurant, eq(mealSuggestion.restaurantId, restaurant.id))
      .innerJoin(menuItem, eq(mealSuggestion.menuItemId, menuItem.id))
      .innerJoin(mealType, eq(mealSuggestion.mealTypeId, mealType.id))
      .where(
        and(
          eq(mealSuggestion.generationId, generationId),
          eq(mealSuggestion.slotDate, slotDate),
          eq(mealSuggestion.mealTypeId, mealTypeId),
        ),
      )
      .orderBy(asc(mealSuggestion.optionIndex)) as Promise<
      (MealSuggestion & {
        restaurant: { id: string; name: string };
        menuItem: { id: string; name: string; price: string; description: string | null };
        mealType: { key: string; label: string };
      })[]
    >;
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
    const rows = await db
      .select({
        id: mealSuggestion.id,
        generationId: mealSuggestion.generationId,
        slotDate: mealSuggestion.slotDate,
        mealTypeId: mealSuggestion.mealTypeId,
        optionIndex: mealSuggestion.optionIndex,
        restaurantId: mealSuggestion.restaurantId,
        menuItemId: mealSuggestion.menuItemId,
        estimatedPrice: mealSuggestion.estimatedPrice,
        notes: mealSuggestion.notes,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
        },
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          description: menuItem.description,
        },
        mealType: {
          key: mealType.key,
          label: mealType.label,
        },
      })
      .from(mealSuggestion)
      .innerJoin(restaurant, eq(mealSuggestion.restaurantId, restaurant.id))
      .innerJoin(menuItem, eq(mealSuggestion.menuItemId, menuItem.id))
      .innerJoin(mealType, eq(mealSuggestion.mealTypeId, mealType.id))
      .where(
        and(eq(mealSuggestion.generationId, generationId), eq(mealSuggestion.slotDate, slotDate)),
      )
      .orderBy(asc(mealSuggestion.mealTypeId), asc(mealSuggestion.optionIndex));
    return rows as (MealSuggestion & {
      restaurant: { id: string; name: string };
      menuItem: { id: string; name: string; price: string; description: string | null };
      mealType: { key: string; label: string };
    })[];
  },
};
