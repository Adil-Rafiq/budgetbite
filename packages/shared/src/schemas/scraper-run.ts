import { z } from 'zod';

import { paginatedSchema, paginationSchema, uuidSchema } from './common.js';

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const scraperRunSchema = z.object({
  id: uuidSchema,
  source: z.string(),
  status: z.enum(['running', 'succeeded', 'failed']),
  area: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  restaurantsUpserted: z.number().int(),
  itemsUpserted: z.number().int(),
  errorMessage: z.string().nullable(),
  startedAt: z.coerce.date(),
  finishedAt: z.coerce.date().nullable(),
});

export const scraperRunListResponseSchema = paginatedSchema(scraperRunSchema);

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const startScraperRunSchema = z.object({
  source: z.string().min(1).max(100).optional(),
  area: z.string().max(200).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const finishScraperRunSchema = z.object({
  status: z.enum(['succeeded', 'failed']),
  restaurantsUpserted: z.coerce.number().int().min(0).optional(),
  itemsUpserted: z.coerce.number().int().min(0).optional(),
  errorMessage: z.string().max(2000).optional(),
});

export const listScraperRunsQuerySchema = paginationSchema;

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScraperRun = z.infer<typeof scraperRunSchema>;
export type ScraperRunListResponse = z.infer<typeof scraperRunListResponseSchema>;
export type StartScraperRunInput = z.infer<typeof startScraperRunSchema>;
export type FinishScraperRunInput = z.infer<typeof finishScraperRunSchema>;
export type ListScraperRunsQuery = z.infer<typeof listScraperRunsQuerySchema>;
