import { apiClient } from '@/lib/api/client';
import type { AnalyticsQuery, MealHistoryItem, Paginated, SpendingAnalytics } from '@repo/shared';

function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = v as string | number;
  }
  return out;
}

export const analyticsApi = {
  getSpending: (query: AnalyticsQuery) =>
    apiClient
      .get('api/analytics/spending', { searchParams: stripUndefined(query) })
      .json<SpendingAnalytics>(),

  getHistory: (query: AnalyticsQuery) =>
    apiClient
      .get('api/analytics/history', { searchParams: stripUndefined(query) })
      .json<Paginated<MealHistoryItem>>(),
};
