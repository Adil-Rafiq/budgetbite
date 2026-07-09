import type { Response, NextFunction } from 'express';

import { AppError } from './error.middleware.js';
import type { AuthRequest } from './auth.middleware.js';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Guard for scheduled-job endpoints under `/api/cron/*`. Deliberately separate
 * from the admin/service key: a cron runner is a machine caller with a single
 * narrow job, so it gets its own least-privilege secret (`CRON_SECRET`) rather
 * than the full-trust `ADMIN_API_KEY`. A leak of one can't be used against the
 * other's surface.
 *
 * The secret is sent as `X-Cron-Secret: <CRON_SECRET>`. When `CRON_SECRET` is
 * unset the endpoint is closed (503) rather than open — a scheduler is expected
 * to configure the secret explicitly.
 */
export function requireCronSecret(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!CRON_SECRET) {
    next(new AppError(503, 'Cron endpoints are not configured', 'CRON_NOT_CONFIGURED'));
    return;
  }
  const provided = req.headers['x-cron-secret'];
  if (typeof provided !== 'string' || provided !== CRON_SECRET) {
    next(new AppError(401, 'Invalid or missing cron secret', 'UNAUTHORIZED'));
    return;
  }
  next();
}
