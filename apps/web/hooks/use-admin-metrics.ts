import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/lib/api/endpoints/admin';

export const useAdminMetrics = () =>
  useQuery({
    queryKey: ['admin', 'metrics'] as const,
    queryFn: () => adminApi.getMetrics(),
  });
