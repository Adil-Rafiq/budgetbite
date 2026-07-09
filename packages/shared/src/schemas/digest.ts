import { z } from 'zod';

/**
 * Outcome of a weekly-digest batch run: how many active plans were considered
 * and how each was handled. `skipped` covers plans whose owner has no verified
 * email or which fall outside their own date window; `failed` counts plans
 * whose email send threw.
 */
export const weeklyDigestResultSchema = z.object({
  total: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export type WeeklyDigestResult = z.infer<typeof weeklyDigestResultSchema>;
