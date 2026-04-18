import { apiClient } from '@/lib/api/client';
import type {
  BudgetPlan,
  CreateBudgetPlanInput,
  UpdateBudgetPlanInput,
  ListRestaurantsQuery,
  BudgetStateContext,
} from '@repo/shared';

type ActiveBudgetPlan = {
  plan: BudgetPlan;
  budgetState: BudgetStateContext;
};

export const budgetPlanApi = {
  list: (params: ListRestaurantsQuery) =>
    apiClient.get('api/budget-plans', { searchParams: params }).json<BudgetPlan[]>(),
  getById: (id: string) => apiClient.get(`api/budget-plans/${id}`).json<BudgetPlan>(),
  getActive: () => apiClient.get('api/budget-plans/active').json<ActiveBudgetPlan>(),
  create: (input: CreateBudgetPlanInput): Promise<BudgetPlan> =>
    apiClient.post('api/budget-plans', { json: input }).json(),
  update: (id: string, input: UpdateBudgetPlanInput): Promise<BudgetPlan> =>
    apiClient.patch(`api/budget-plans/${id}`, { json: input }).json(),
  getContext: (id: string): Promise<BudgetStateContext> =>
    apiClient.get(`api/budget-plans/${id}/context`).json(),
};
