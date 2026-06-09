import type { AdminConfig } from '@repo/shared';

export const configService = {
  /**
   * Effective values of the safe, behaviour-shaping env knobs. Never returns
   * secrets — only the tuning flags an admin may want to verify at a glance.
   */
  effective(): AdminConfig {
    return {
      nearbyRadiusKm: process.env.NEARBY_RADIUS_KM ?? null,
      maxRestaurants: process.env.MAX_RESTAURANTS ?? null,
      maxItemsPerRestaurant: process.env.MAX_ITEMS_PER_RESTAURANT ?? null,
      replanDeviationThreshold: process.env.REPLAN_CUMULATIVE_DEVIATION_RATIO_THRESHOLD ?? null,
      aiProvider: process.env.AI_PROVIDER ?? null,
      aiModelName: process.env.AI_MODEL_NAME ?? null,
    };
  },
};
