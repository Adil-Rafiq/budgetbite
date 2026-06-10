import { useQuery } from '@tanstack/react-query';
import type { ListScraperRunsQuery } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';

const ADMIN_SCRAPER_RUNS_KEY = ['admin', 'scraper-runs'] as const;

export const useAdminScraperRuns = (query: Partial<ListScraperRunsQuery>) =>
  useQuery({
    queryKey: [...ADMIN_SCRAPER_RUNS_KEY, query] as const,
    queryFn: () => adminApi.listScraperRuns(query),
  });
