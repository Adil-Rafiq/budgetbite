import type { Request, Response } from 'express';
import { mealTypeRepository } from '@repo/database';

export async function listMealTypes(_req: Request, res: Response): Promise<void> {
  const types = await mealTypeRepository.listActive();
  res.json(types);
}
