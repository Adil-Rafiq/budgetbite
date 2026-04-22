import type { Response } from 'express';
import type { UpdateUserProfileInput } from '@repo/shared';

import type { AuthRequest } from '../middleware/auth.middleware.js';
import { userService } from '../services/user.service.js';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await userService.getMe(req.userId!);
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await userService.updateUserProfile(
    req.userId!,
    req.body as UpdateUserProfileInput,
  );
  res.json(profile);
};
