import type { Response } from "express";
import { recordMealChoiceSchema, uuidSchema } from "@repo/shared";
import { orderService } from "../services/order.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export async function recordChoice(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const body = recordMealChoiceSchema.parse(req.body);
  const choice = await orderService.recordChoice(userId, body);
  res.status(201).json(choice);
}

export async function listByPlan(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const budgetPlanId = uuidSchema.parse(req.params.planId);
  const list = await orderService.listByPlan(userId, budgetPlanId);
  res.json(list);
}
