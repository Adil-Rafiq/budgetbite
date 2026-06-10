import type { AdminMetrics, DataQuality } from '@repo/shared';
import { adminAnalyticsRepository } from '@repo/database';

export const adminAnalyticsService = {
  async dataQuality(): Promise<DataQuality> {
    return adminAnalyticsRepository.dataQuality();
  },

  async metrics(): Promise<AdminMetrics> {
    return adminAnalyticsRepository.metrics();
  },
};
