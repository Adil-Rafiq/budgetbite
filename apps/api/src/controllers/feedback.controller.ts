import type { Response } from 'express';
import type { FeedbackInput } from '@repo/shared';

import { feedbackService } from '../services/feedback.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function submitFeedback(req: AuthRequest, res: Response): Promise<void> {
  const result = await feedbackService.submit(req.userId!, req.body as FeedbackInput);
  res.status(201).json(result);
}
