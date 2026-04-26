import { useQuery } from '@tanstack/react-query';
import type { AnalyticsQuery } from '@repo/shared';

import { analyticsApi } from '@/lib/api/endpoints/analytics';

export const useSpendingAnalytics = (query: AnalyticsQuery) =>
  useQuery({
    queryKey: ['analytics', 'spending', query] as const,
    queryFn: () => analyticsApi.getSpending(query),
    enabled: !!query.startDate && !!query.endDate,
  });

export const useMealHistory = (query: AnalyticsQuery) =>
  useQuery({
    queryKey: ['analytics', 'history', query] as const,
    queryFn: () => analyticsApi.getHistory(query),
    enabled: !!query.startDate && !!query.endDate,
  });
