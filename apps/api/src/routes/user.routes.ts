import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router: Router = Router();

router.use(authMiddleware);

// Returns current authenticated user combined with their user-profile
router.get('/me', userController.getMe);

// Creates or updates user's profile
router.put('/me/profile', userController.updateProfile);

export default router;
