import { useQuery } from '@tanstack/react-query';
import type { ListAdminPlansQuery } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';

const ADMIN_PLANS_KEY = ['admin', 'budget-plans'] as const;

export const useAdminPlans = (query: Partial<ListAdminPlansQuery>) =>
  useQuery({
    queryKey: [...ADMIN_PLANS_KEY, query] as const,
    queryFn: () => adminApi.listBudgetPlans(query),
  });

export const useAdminPlan = (id: string) =>
  useQuery({
    queryKey: [...ADMIN_PLANS_KEY, id] as const,
    queryFn: () => adminApi.getBudgetPlan(id),
    enabled: !!id,
  });
