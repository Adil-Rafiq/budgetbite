import type { RecordMealChoiceInput } from "../lib/validation.js";
import { budgetPlanRepository, orderRepository } from "@repo/database";
import { AppError } from "../middleware/error.middleware.js";

export const orderService = {
  async recordChoice(userId: string, input: RecordMealChoiceInput) {
    const plan = await budgetPlanRepository.findById(input.budgetPlanId);
    if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
    if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");
    if (plan.status !== "active") {
      throw new AppError(400, "Plan is not active", "PLAN_NOT_ACTIVE");
    }

    const choice = await orderRepository.create({
      userId,
      budgetPlanId: input.budgetPlanId,
      slotDate: input.slotDate,
      mealTypeId: input.mealTypeId,
      suggestionId: input.suggestionId ?? null,
      manualDescription: input.manualDescription ?? null,
      actualAmountSpent: String(input.actualAmountSpent),
      restaurantName: input.restaurantName ?? null,
    });
    return {
      id: choice.id,
      budgetPlanId: choice.budgetPlanId,
      slotDate: choice.slotDate,
      mealTypeId: choice.mealTypeId,
      suggestionId: choice.suggestionId,
      manualDescription: choice.manualDescription,
      actualAmountSpent: Number(choice.actualAmountSpent),
      restaurantName: choice.restaurantName,
      createdAt: choice.createdAt,
    };
  },

  async listByPlan(userId: string, budgetPlanId: string) {
    const plan = await budgetPlanRepository.findById(budgetPlanId);
    if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
    if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");
    const choices = await orderRepository.listByUserAndPlan(userId, budgetPlanId);
    return choices.map((c) => ({
      id: c.id,
      budgetPlanId: c.budgetPlanId,
      slotDate: c.slotDate,
      mealTypeId: c.mealTypeId,
      suggestionId: c.suggestionId,
      manualDescription: c.manualDescription,
      actualAmountSpent: Number(c.actualAmountSpent),
      restaurantName: c.restaurantName,
      createdAt: c.createdAt,
    }));
  },
};
