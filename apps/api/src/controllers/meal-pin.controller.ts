import type { Response } from 'express';
import type { CreateMealPinInput, ListMealPinsQuery } from '@repo/shared';

import { mealPinService } from '../services/meal-pin.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

type PlanIdParams = { id: string };
type PinIdParams = { pinId: string };

export async function createPin(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as PlanIdParams;
  const pin = await mealPinService.upsertPin(req.userId!, id, req.body as CreateMealPinInput);
  res.status(201).json(pin);
}

export async function listPins(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as PlanIdParams;
  const pins = await mealPinService.listByPlan(
    req.userId!,
    id,
    req.query as unknown as ListMealPinsQuery,
  );
  res.json(pins);
}

export async function deletePin(req: AuthRequest, res: Response): Promise<void> {
  const { pinId } = req.params as PinIdParams;
  await mealPinService.deletePin(req.userId!, pinId);
  res.status(204).send();
}
