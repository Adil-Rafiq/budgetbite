import { eq, and, asc } from "drizzle-orm";

import { db } from "../db";
import {
    mealPlanGenerations,
    mealSuggestions,
    menuItems,
    restaurants,
    mealTypes,
    type MealPlanGeneration,
    type MealSuggestion,
} from "../schema/index";

export const mealPlanRepository = {
    async createGeneration(budgetPlanId: string): Promise<MealPlanGeneration> {
        const [inserted] = await db
            .insert(mealPlanGenerations)
            .values({ budgetPlanId })
            .returning();

        if (!inserted) throw new Error("MealPlanGeneration insert failed");
        return inserted;
    },

    async getLatestGenerationId(budgetPlanId: string): Promise<string | undefined> {
        const [row] = await db.select({ id: mealPlanGenerations.id }).from(mealPlanGenerations).where(eq(mealPlanGenerations.budgetPlanId, budgetPlanId)).orderBy(mealPlanGenerations.generatedAt).limit(1);
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
                id: mealSuggestions.id,
                generationId: mealSuggestions.generationId,
                slotDate: mealSuggestions.slotDate,
                mealTypeId: mealSuggestions.mealTypeId,
                optionIndex: mealSuggestions.optionIndex,
                restaurantId: mealSuggestions.restaurantId,
                menuItemId: mealSuggestions.menuItemId,
                estimatedPrice: mealSuggestions.estimatedPrice,
                notes: mealSuggestions.notes,
                restaurant: {
                    id: restaurants.id,
                    name: restaurants.name,
                },
                menuItem: {
                    id: menuItems.id,
                    name: menuItems.name,
                    price: menuItems.price,
                    description: menuItems.description,
                },
                mealType: {
                    key: mealTypes.key,
                    label: mealTypes.label,
                },
            })
            .from(mealSuggestions)
            .innerJoin(restaurants, eq(mealSuggestions.restaurantId, restaurants.id))
            .innerJoin(menuItems, eq(mealSuggestions.menuItemId, menuItems.id))
            .innerJoin(mealTypes, eq(mealSuggestions.mealTypeId, mealTypes.id))
            .where(
                and(
                    eq(mealSuggestions.generationId, generationId),
                    eq(mealSuggestions.slotDate, slotDate),
                    eq(mealSuggestions.mealTypeId, mealTypeId),
                ),
            )
            .orderBy(asc(mealSuggestions.optionIndex)) as Promise<
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
                id: mealSuggestions.id,
                generationId: mealSuggestions.generationId,
                slotDate: mealSuggestions.slotDate,
                mealTypeId: mealSuggestions.mealTypeId,
                optionIndex: mealSuggestions.optionIndex,
                restaurantId: mealSuggestions.restaurantId,
                menuItemId: mealSuggestions.menuItemId,
                estimatedPrice: mealSuggestions.estimatedPrice,
                notes: mealSuggestions.notes,
                restaurant: {
                    id: restaurants.id,
                    name: restaurants.name,
                },
                menuItem: {
                    id: menuItems.id,
                    name: menuItems.name,
                    price: menuItems.price,
                    description: menuItems.description,
                },
                mealType: {
                    key: mealTypes.key,
                    label: mealTypes.label,
                },
            })
            .from(mealSuggestions)
            .innerJoin(restaurants, eq(mealSuggestions.restaurantId, restaurants.id))
            .innerJoin(menuItems, eq(mealSuggestions.menuItemId, menuItems.id))
            .innerJoin(mealTypes, eq(mealSuggestions.mealTypeId, mealTypes.id))
            .where(
                and(eq(mealSuggestions.generationId, generationId), eq(mealSuggestions.slotDate, slotDate)),
            )
            .orderBy(asc(mealSuggestions.mealTypeId), asc(mealSuggestions.optionIndex));
        return rows as (MealSuggestion & {
            restaurant: { id: string; name: string };
            menuItem: { id: string; name: string; price: string; description: string | null };
            mealType: { key: string; label: string };
        })[];
    },
}