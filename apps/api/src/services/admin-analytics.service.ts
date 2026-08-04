import type { AdminMap, AdminMetrics, DataQuality } from '@repo/shared';
import { flagOutliers } from '@repo/shared';
import { adminAnalyticsRepository } from '@repo/database';

export const adminAnalyticsService = {
  async dataQuality(): Promise<DataQuality> {
    return adminAnalyticsRepository.dataQuality();
  },

  async metrics(): Promise<AdminMetrics> {
    return adminAnalyticsRepository.metrics();
  },

  /**
   * The admin coverage map: where the catalogue is, where the users are, and
   * which coordinates cannot be right.
   */
  async coverage(): Promise<AdminMap> {
    const raw = await adminAnalyticsRepository.coverage();

    // Drizzle hands back `numeric`/`decimal` as strings; coerce at the service
    // boundary so no string reaches a component that will try to draw with it.
    const pins = raw.pins.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      source: p.source as 'foodpanda' | 'community',
      menuItemCount: p.menuItemCount,
      rating: p.rating != null ? Number(p.rating) : null,
      updatedAt: p.updatedAt,
    }));

    // Outliers are judged here rather than in SQL: it is a comparison against
    // the median of every other pin, and `flagOutliers` already exists and is
    // unit-tested. Reimplementing it as a window function would buy nothing.
    const restaurants = flagOutliers(pins);

    // What the suppression actually cost, derived rather than queried. The
    // returned cells are the surviving ones, so everyone with a location who
    // is not in one of them was in a cell too sparse to publish.
    const usersInShownCells = raw.cells.reduce((sum, c) => sum + c.count, 0);

    return {
      restaurants,
      restaurantsTotal: raw.restaurantsTotal,
      truncated: raw.restaurantsTotal > raw.pinLimit,
      staleDays: raw.staleDays,

      userCells: raw.cells,
      cellDegrees: raw.cellDegrees,
      minCellCount: raw.minCellCount,
      usersInSuppressedCells: Math.max(0, raw.usersWithLocation - usersInShownCells),
      usersWithoutLocation: Math.max(0, raw.userTotal - raw.usersWithLocation),
      userTotal: raw.userTotal,
    };
  },
};
