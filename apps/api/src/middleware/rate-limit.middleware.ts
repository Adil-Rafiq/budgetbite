import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import type { AuthRequest } from './auth.middleware.js';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 100;

const MENU_EXTRACTION_WINDOW_MS =
  Number(process.env.MENU_EXTRACTION_RATE_LIMIT_WINDOW_MS) || 10 * 60_000;
const MENU_EXTRACTION_MAX = Number(process.env.MENU_EXTRACTION_RATE_LIMIT_MAX) || 5;

const SLOT_REROLL_WINDOW_MS = Number(process.env.SLOT_REROLL_RATE_LIMIT_WINDOW_MS) || 10 * 60_000;
const SLOT_REROLL_MAX = Number(process.env.SLOT_REROLL_RATE_LIMIT_MAX) || 6;

// The scraper authenticates with the service key and does legitimate bulk
// uploads — exempt it so menu ingestion isn't throttled.
const isServiceCaller = (req: Request): boolean => {
  const apiKey = req.headers['x-api-key'];
  return typeof apiKey === 'string' && !!ADMIN_API_KEY && apiKey === ADMIN_API_KEY;
};

/**
 * Tight per-user limiter for the menu-image AI extraction endpoint — each hit
 * is a paid multimodal LLM call, so it gets its own budget far below the
 * general API limit. Mounted after authMiddleware, so a userId is always
 * present and the key survives IP changes (mobile networks) while also not
 * letting one user spread abuse across IPs.
 */
export const menuExtractionRateLimiter = rateLimit({
  windowMs: MENU_EXTRACTION_WINDOW_MS,
  limit: MENU_EXTRACTION_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => `user:${(req as AuthRequest).userId}`,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error:
        'You have used menu extraction too many times in a short period. Please wait a bit and try again, or add the items manually.',
      code: 'RATE_LIMITED',
    });
  },
});

/**
 * Per-user limiter for single-slot rerolls — each reroll is a paid LLM call a
 * user can fire with one tap, so bursts get their own tight budget. Works
 * alongside the per-slot reroll cap enforced in the service (this guards
 * cross-slot spamming; the cap guards grinding one slot).
 */
export const slotRerollRateLimiter = rateLimit({
  windowMs: SLOT_REROLL_WINDOW_MS,
  limit: SLOT_REROLL_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => `user:${(req as AuthRequest).userId}`,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error:
        'You have rerolled suggestions too many times in a short period. Please wait a bit and try again.',
      code: 'RATE_LIMITED',
    });
  },
});

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
