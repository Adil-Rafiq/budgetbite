import { apiClient } from '@/lib/api/client';
import type { CreateBudgetPlanInput } from '@repo/shared';

export const budgetApi = {
  getActive: () => apiClient.get('api/budget/active').json(),
  create: (input: CreateBudgetPlanInput) => apiClient.post('api/budget', { json: input }).json(),
};
