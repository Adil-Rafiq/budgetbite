import type { AnalyticsQuery } from "../lib/validation.js";
import { orderRepository, budgetPlanRepository } from "@repo/database";
import { AppError } from "../middleware/error.middleware.js";

export const analyticsService = {
  async getSpendingSummary(userId: string, query: AnalyticsQuery) {
    let startDate = query.startDate;
    let endDate = query.endDate;

    if (query.budgetPlanId) {
      const plan = await budgetPlanRepository.findById(query.budgetPlanId);
      if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
      if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");
      startDate = plan.startDate;
      endDate = plan.endDate;
    }

    const choices = await orderRepository.listByUserInDateRange(userId, startDate, endDate);
    const totalSpent = choices.reduce((sum, c) => sum + Number(c.actualAmountSpent), 0);
    const byDate = new Map<string, number>();
    for (const c of choices) {
      const prev = byDate.get(c.slotDate) ?? 0;
      byDate.set(c.slotDate, prev + Number(c.actualAmountSpent));
    }
    const daily = Array.from(byDate.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      startDate,
      endDate,
      totalSpent,
      mealCount: choices.length,
      daily,
    };
  },

  async getMealHistory(userId: string, query: AnalyticsQuery) {
    let startDate = query.startDate;
    let endDate = query.endDate;
    if (query.budgetPlanId) {
      const plan = await budgetPlanRepository.findById(query.budgetPlanId);
      if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
      if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");
      startDate = plan.startDate;
      endDate = plan.endDate;
    }
    const choices = await orderRepository.listByUserInDateRange(userId, startDate, endDate);
    return choices.map((c) => ({
      id: c.id,
      slotDate: c.slotDate,
      mealTypeId: c.mealTypeId,
      actualAmountSpent: Number(c.actualAmountSpent),
      restaurantName: c.restaurantName,
      manualDescription: c.manualDescription,
      createdAt: c.createdAt,
    }));
  },
};
