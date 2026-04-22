import type { Request, Response } from 'express';

import { mealTypeService } from '../services/meal-type.service.js';

export async function listMealTypes(_req: Request, res: Response): Promise<void> {
  const types = await mealTypeService.listActive();
  res.json(types);
}
