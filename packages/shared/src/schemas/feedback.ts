import { z } from 'zod';

import { uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const feedbackSchema = z.object({
  mealChoiceId: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  liked: z.boolean().optional(),
  comment: z.string().max(500).optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const feedbackResponseSchema = z.object({
  id: z.string(),
  mealChoiceId: z.string(),
  rating: z.number().nullable(),
  liked: z.boolean().nullable(),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;