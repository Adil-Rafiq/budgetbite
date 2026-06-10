import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/lib/api/endpoints/admin';

export const useAdminConfig = () =>
  useQuery({
    queryKey: ['admin', 'config'] as const,
    queryFn: () => adminApi.getConfig(),
  });
