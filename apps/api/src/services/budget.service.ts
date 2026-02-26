import type { CreateBudgetPlanInput, UpdateBudgetPlanInput } from "@repo/shared";
import { budgetPlanRepository, orderRepository } from "@repo/database";
import { AppError } from "../middleware/error.middleware.js";

export const budgetService = {
  async create(userId: string, input: CreateBudgetPlanInput) {
    const plan = await budgetPlanRepository.create(
      {
        userId,
        planType: input.planType,
        totalBudget: String(input.totalBudget),
        startDate: input.startDate,
        endDate: input.endDate,
        mealsPerDay: input.mealsPerDay,
        notificationTimes: input.notificationTimes ?? null,
        status: "active",
      },
      input.mealTypeIds,
    );
    return this.toResponse(plan);
  },

  async getActive(userId: string) {
    const plan = await budgetPlanRepository.findActiveByUserId(userId);
    if (!plan) return null;
    const spent = await orderRepository.getSpentTotalByPlan(plan.id);
    const mealTypeIds = await budgetPlanRepository.getMealTypeIds(plan.id);
    return {
      ...this.toResponse(plan),
      spentAmount: Number(spent),
      remainingAmount: Number(plan.totalBudget) - Number(spent),
      mealTypeIds,
    };
  },

  async getById(userId: string, planId: string) {
    const plan = await budgetPlanRepository.findById(planId);
    if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
    if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");
    const spent = await orderRepository.getSpentTotalByPlan(plan.id);
    const mealTypeIds = await budgetPlanRepository.getMealTypeIds(plan.id);
    return {
      ...this.toResponse(plan),
      spentAmount: Number(spent),
      remainingAmount: Number(plan.totalBudget) - Number(spent),
      mealTypeIds,
    };
  },

  async list(userId: string, limit?: number) {
    const plans = await budgetPlanRepository.listByUserId(userId, limit);
    return plans.map(this.toResponse);
  },

  async update(userId: string, planId: string, input: UpdateBudgetPlanInput) {
    const plan = await budgetPlanRepository.findById(planId);
    if (!plan) throw new AppError(404, "Budget plan not found", "NOT_FOUND");
    if (plan.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");
    const updated = await budgetPlanRepository.update(planId, {
      totalBudget: input.totalBudget != null ? String(input.totalBudget) : undefined,
      notificationTimes: input.notificationTimes ?? undefined,
      status: input.status,
    });
    return this.toResponse(updated);
  },

  toResponse(plan: {
    id: string;
    userId: string;
    planType: string;
    totalBudget: string;
    startDate: string;
    endDate: string;
    mealsPerDay: number;
    notificationTimes: string[] | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: plan.id,
      userId: plan.userId,
      planType: plan.planType,
      totalBudget: Number(plan.totalBudget),
      startDate: plan.startDate,
      endDate: plan.endDate,
      mealsPerDay: plan.mealsPerDay,
      notificationTimes: plan.notificationTimes ?? [],
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  },
};
