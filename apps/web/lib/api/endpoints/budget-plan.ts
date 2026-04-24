import { apiClient } from '@/lib/api/client';
import type {
  ListBudgetPlansQuery,
  BudgetPlanResponse,
  CreateBudgetPlanInput,
  UpdateBudgetPlanInput,
  ActiveBudgetPlanResponse,
  BudgetPlanDetail,
  BudgetStateContext,
  PaginationMeta,
} from '@repo/shared';

export type BudgetPlansWithMeta = {
  data: BudgetPlanResponse[];
  meta: PaginationMeta;
};

export const budgetPlanApi = {
  list: (params: ListBudgetPlansQuery) =>
    apiClient.get('api/budget-plans', { searchParams: params }).json<BudgetPlansWithMeta>(),
  getById: (id: string) => apiClient.get(`api/budget-plans/${id}`).json<BudgetPlanDetail>(),
  getActive: () => apiClient.get('api/budget-plans/active').json<ActiveBudgetPlanResponse>(),
  create: (input: CreateBudgetPlanInput): Promise<BudgetPlanResponse> =>
    apiClient.post('api/budget-plans', { json: input }).json(),
  update: (id: string, input: UpdateBudgetPlanInput): Promise<BudgetPlanResponse> =>
    apiClient.patch(`api/budget-plans/${id}`, { json: input }).json(),
  getContext: (id: string): Promise<BudgetStateContext> =>
    apiClient.get(`api/budget-plans/${id}/context`).json(),
};
