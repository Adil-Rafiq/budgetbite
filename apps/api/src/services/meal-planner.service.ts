import type { GetSuggestionsQuery } from "../lib/validation.js";
import { budgetPlanRepository, mealPlanRepository, mealTypeRepository } from "@budgetbite/database";
import { AppError } from "../middleware/error.middleware.js";

export const mealPlannerService = {
  async getSuggestionsForDay(userId: string, query: GetSuggestionsQuery) {
    const activePlan = await budgetPlanRepository.findActiveByUserId(userId);
    if (!activePlan) throw new AppError(400, "No active budget plan", "NO_ACTIVE_PLAN");

    const generationId = await mealPlanRepository.getLatestGenerationId(activePlan.id);
    if (!generationId) {
      return { date: query.date, slots: [] };
    }

    const suggestions = await mealPlanRepository.getSuggestionsForDay(generationId, query.date);
    const mealTypes = await mealTypeRepository.listActive();

    const bySlot = new Map<string, typeof suggestions>();
    for (const s of suggestions) {
      const key = s.mealTypeId;
      if (!bySlot.has(key)) bySlot.set(key, []);
      bySlot.get(key)!.push(s);
    }

    const slots = mealTypes
      .filter((mt) => bySlot.has(mt.id))
      .map((mt) => ({
        mealTypeId: mt.id,
        mealTypeKey: mt.key,
        mealTypeLabel: mt.label,
        options: (bySlot.get(mt.id) ?? []).map((o) => ({
          id: o.id,
          optionIndex: o.optionIndex,
          restaurantId: o.restaurantId,
          restaurantName: o.restaurant?.name,
          menuItemId: o.menuItemId,
          menuItemName: o.menuItem?.name,
          description: o.menuItem?.description ?? undefined,
          estimatedPrice: o.estimatedPrice != null ? Number(o.estimatedPrice) : Number(o.menuItem?.price),
          notes: o.notes ?? undefined,
        })),
      }));

    if (query.mealTypeId) {
      return {
        date: query.date,
        slots: slots.filter((s) => s.mealTypeId === query.mealTypeId),
      };
    }
    return { date: query.date, slots };
  },

  async generatePlan(userId: string, budgetPlanId: string) {
    const plan = await budgetPlanRepository.findById(budgetPlanId);
    if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
    if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");

    const generation = await mealPlanRepository.createGeneration(budgetPlanId);
    return {
      generationId: generation.id,
      budgetPlanId,
      generatedAt: generation.generatedAt,
    };
  },
};
