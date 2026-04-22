import type { Response } from 'express';
import type { AnalyticsQuery } from '@repo/shared';

import { analyticsService } from '../services/analytics.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function getSpendingSummary(req: AuthRequest, res: Response): Promise<void> {
  const result = await analyticsService.getSpendingSummary(
    req.userId!,
    req.query as unknown as AnalyticsQuery,
  );
  res.json(result);
}

export async function getMealHistory(req: AuthRequest, res: Response): Promise<void> {
  const result = await analyticsService.getMealHistory(
    req.userId!,
    req.query as unknown as AnalyticsQuery,
  );
  res.json(result);
}
