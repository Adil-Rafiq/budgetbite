import type { Response } from 'express';
import type {
  CreateBudgetPlanInput,
  ListBudgetPlansQuery,
  RecordMealChoiceInput,
  UpdateBudgetPlanInput,
} from '@repo/shared';

import { budgetPlanService } from '../services/budget-plan.service.js';
import { mealChoiceService } from '../services/meal-choice.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

// All request parsing happens in the `validate` middleware on the route — these
// handlers read already-typed req.params / req.query / req.body.

type IdParams = { id: string };
type PaginationQuery = { limit: number; offset: number };

export async function createPlan(req: AuthRequest, res: Response): Promise<void> {
  const plan = await budgetPlanService.create(req.userId!, req.body as CreateBudgetPlanInput);
  res.status(201).json(plan);
}

export async function listPlans(req: AuthRequest, res: Response): Promise<void> {
  const result = await budgetPlanService.list(
    req.userId!,
    req.query as unknown as ListBudgetPlansQuery,
  );
  res.json(result);
}

export async function getActivePlan(req: AuthRequest, res: Response): Promise<void> {
  const result = await budgetPlanService.getActive(req.userId!);
  res.json(result);
}

export async function getPlanById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const plan = await budgetPlanService.getById(req.userId!, id);
  res.json(plan);
}

export async function updatePlan(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const plan = await budgetPlanService.update(req.userId!, id, req.body as UpdateBudgetPlanInput);
  res.json(plan);
}

export async function getPlanContext(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const ctx = await budgetPlanService.getContext(req.userId!, id);
  res.json(ctx);
}

export async function listChoices(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const { limit, offset } = req.query as unknown as PaginationQuery;
  const result = await mealChoiceService.listByPlan(req.userId!, id, { limit, offset });
  res.json(result);
}

export async function recordChoice(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const choice = await mealChoiceService.recordChoice(
    req.userId!,
    id,
    req.body as RecordMealChoiceInput,
  );
  res.status(201).json(choice);
}

export async function generateMealPlan(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const result = await budgetPlanService.generateMealPlan(req.userId!, id);
  res.status(201).json(result);
}
