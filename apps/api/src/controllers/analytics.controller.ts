import type { Response } from 'express';
import { analyticsQuerySchema } from '@repo/shared';
import { analyticsService } from '../services/analytics.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function getSpendingSummary(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const query = analyticsQuerySchema.parse(req.query);
  const result = await analyticsService.getSpendingSummary(userId, query);
  res.json(result);
}

export async function getMealHistory(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const query = analyticsQuerySchema.parse(req.query);
  const result = await analyticsService.getMealHistory(userId, query);
  res.json(result);
}
