import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 100;

// The scraper authenticates with the service key and does legitimate bulk
// uploads — exempt it so menu ingestion isn't throttled.
const isServiceCaller = (req: Request): boolean => {
  const apiKey = req.headers['x-api-key'];
  return typeof apiKey === 'string' && !!ADMIN_API_KEY && apiKey === ADMIN_API_KEY;
};

export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS,
  standardHeaders: 'draft-7', // emit RateLimit-* headers so clients can self-pace
  legacyHeaders: false, // drop the deprecated X-RateLimit-* headers
  skip: isServiceCaller,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests, please slow down and try again shortly.',
      code: 'RATE_LIMITED',
    });
  },
});
