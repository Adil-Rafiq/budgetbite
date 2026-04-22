import type { Response } from 'express';
import type { GetSuggestionsQuery } from '@repo/shared';

import { mealPlanService } from '../services/meal-plan.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function getSuggestions(req: AuthRequest, res: Response): Promise<void> {
  const result = await mealPlanService.getSuggestionsForDay(
    req.userId!,
    req.query as unknown as GetSuggestionsQuery,
  );
  res.json(result);
}
