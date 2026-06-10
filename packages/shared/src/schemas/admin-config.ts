import { z } from 'zod';

// Read-only view of the safe, behaviour-shaping env knobs. Secrets (API keys,
// DB URLs, auth secrets) are never included.

export const adminConfigSchema = z.object({
  nearbyRadiusKm: z.string().nullable(),
  maxRestaurants: z.string().nullable(),
  maxItemsPerRestaurant: z.string().nullable(),
  replanDeviationThreshold: z.string().nullable(),
  aiProvider: z.string().nullable(),
  aiModelName: z.string().nullable(),
});

export type AdminConfig = z.infer<typeof adminConfigSchema>;
