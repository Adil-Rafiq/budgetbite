import { Router } from 'express';
import { updateUserProfileSchema } from '@repo/shared';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as userController from '../controllers/user.controller.js';

const router: Router = Router();

router.use(authMiddleware);

/** Get the authenticated user merged with their user_profile. Returns UserWithProfile. */
router.get('/me', asyncHandler(userController.getMe));

/** Upsert the caller's user_profile (latitude / longitude). Returns UserProfile. */
router.put(
  '/me/profile',
  validate({ body: updateUserProfileSchema }),
  asyncHandler(userController.updateProfile),
);

export default router;
