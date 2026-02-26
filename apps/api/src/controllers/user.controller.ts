import type { Response } from 'express';
import { updateProfileSchema } from '@repo/shared';
import { userService } from '../services/user.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function getProfile(_req: AuthRequest, res: Response): Promise<void> {
  const userId = _req.userId!;
  const profile = await userService.getProfile(userId);
  res.json(profile);
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const body = updateProfileSchema.parse(req.body);
  const profile = await userService.updateProfile(userId, body);
  res.json(profile);
}
