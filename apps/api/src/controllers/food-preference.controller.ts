import type { Response } from 'express';
import type { UpsertFoodPreferenceInput, DeleteFoodPreferenceInput } from '@repo/shared';

import { foodPreferenceService } from '../services/food-preference.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function listFoodPreferences(req: AuthRequest, res: Response): Promise<void> {
  const prefs = await foodPreferenceService.list(req.userId!);
  res.json(prefs);
}

export async function upsertFoodPreference(req: AuthRequest, res: Response): Promise<void> {
  const pref = await foodPreferenceService.upsert(
    req.userId!,
    req.body as UpsertFoodPreferenceInput,
  );
  res.status(201).json(pref);
}

export async function deleteFoodPreference(req: AuthRequest, res: Response): Promise<void> {
  await foodPreferenceService.remove(req.userId!, req.body as DeleteFoodPreferenceInput);
  res.status(204).send();
}
