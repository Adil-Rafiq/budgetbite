import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/lib/api/endpoints/admin';

export const useAdminDataQuality = () =>
  useQuery({
    queryKey: ['admin', 'data-quality'] as const,
    queryFn: () => adminApi.getDataQuality(),
  });
