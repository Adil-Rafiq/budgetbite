import type { Request, Response } from 'express';

import { digestService } from '../services/digest.service.js';

// ─── Scheduled jobs ───────────────────────────────────────────────────────────
// Endpoints here are driven by an external scheduler (no in-process worker tier)
// and gated by the cron secret, not the admin/service key. See cron.middleware.

export async function sendWeeklyDigests(_req: Request, res: Response): Promise<void> {
  const result = await digestService.sendWeeklyDigests();
  res.json(result);
}
