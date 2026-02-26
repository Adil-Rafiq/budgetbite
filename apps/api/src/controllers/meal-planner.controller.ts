import type { Response } from "express";
import { getSuggestionsSchema, uuidSchema } from "@repo/shared";
import { mealPlannerService } from "../services/meal-planner.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export async function getSuggestions(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const query = getSuggestionsSchema.parse(req.query);
  const result = await mealPlannerService.getSuggestionsForDay(userId, query);
  res.json(result);
}

export async function generatePlan(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const budgetPlanId = uuidSchema.parse(req.params.planId);
  const result = await mealPlannerService.generatePlan(userId, budgetPlanId);
  res.status(201).json(result);
}
