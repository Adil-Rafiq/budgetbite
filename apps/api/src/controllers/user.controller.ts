import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { userService } from '../services/user.service.js';
import { updateUserProfileSchema } from '@repo/shared';

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await userService.getMe(req.userId!);
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const body = updateUserProfileSchema.parse(req.body);
  const profile = await userService.updateUserProfile(req.userId!, body);
  res.json(profile);
};
