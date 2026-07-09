import { Router } from 'express';

import { requireCronSecret } from '../middleware/cron.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';
import * as cronController from '../controllers/cron.controller.js';

const router: Router = Router();

// Every route here is a machine-triggered scheduled job, gated by the cron
// secret (X-Cron-Secret) rather than a user session or the admin/service key.
router.use(requireCronSecret);

/**
 * Email the weekly "spent X of Y" progress digest to every eligible active
 * plan. Meant to be hit weekly by an external scheduler (Vercel/Cloudflare
 * cron, GitHub Actions, cron-job.org, …). Idempotent within a week: plans sent
 * inside the cooldown window are skipped. Returns { total, sent, skipped, failed }.
 */
router.post('/digests/weekly', asyncHandler(cronController.sendWeeklyDigests));

export default router;
