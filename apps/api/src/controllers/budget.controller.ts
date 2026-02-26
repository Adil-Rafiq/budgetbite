import type { Response } from "express";
import { createBudgetPlanSchema, updateBudgetPlanSchema, uuidSchema, paginationSchema } from "@repo/shared";
import { budgetService } from "../services/budget.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export async function createPlan(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const body = createBudgetPlanSchema.parse(req.body);
  const plan = await budgetService.create(userId, body);
  res.status(201).json(plan);
}

export async function getActivePlan(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const plan = await budgetService.getActive(userId);
  res.json(plan);
}

export async function getPlanById(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const planId = uuidSchema.parse(req.params.id);
  const plan = await budgetService.getById(userId, planId);
  res.json(plan);
}

export async function listPlans(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { limit } = paginationSchema.parse(req.query);
  const plans = await budgetService.list(userId, limit);
  res.json(plans);
}

export async function updatePlan(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const planId = uuidSchema.parse(req.params.id);
  const body = updateBudgetPlanSchema.parse(req.body);
  const plan = await budgetService.update(userId, planId, body);
  res.json(plan);
}
