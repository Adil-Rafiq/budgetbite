import { apiClient } from '@/lib/api/client';
import type {
  ListBudgetPlansQuery,
  BudgetPlanResponse,
  CreateBudgetPlanInput,
  UpdateBudgetPlanInput,
  ActiveBudgetPlanResponse,
  BudgetPlanDetail,
  BudgetStateContext,
  ListBudgetGenerationsResponse,
  BudgetGenerationDetailResponse,
  Paginated,
  PaginationQuery,
} from '@repo/shared';

export const budgetPlanApi = {
  list: (params: ListBudgetPlansQuery) =>
    apiClient
      .get('api/budget-plans', { searchParams: params })
      .json<Paginated<BudgetPlanResponse>>(),
  getById: (id: string) => apiClient.get(`api/budget-plans/${id}`).json<BudgetPlanDetail>(),
  getActive: () => apiClient.get('api/budget-plans/active').json<ActiveBudgetPlanResponse>(),
  create: (input: CreateBudgetPlanInput): Promise<BudgetPlanResponse> =>
    apiClient.post('api/budget-plans', { json: input }).json(),
  update: (id: string, input: UpdateBudgetPlanInput): Promise<BudgetPlanResponse> =>
    apiClient.patch(`api/budget-plans/${id}`, { json: input }).json(),
  cancel: (id: string): Promise<BudgetPlanResponse> =>
    apiClient.post(`api/budget-plans/${id}/cancel`).json(),
  getContext: (id: string): Promise<BudgetStateContext> =>
    apiClient.get(`api/budget-plans/${id}/context`).json(),
  listGenerations: (planId: string, params: PaginationQuery) =>
    apiClient
      .get(`api/budget-plans/${planId}/generations`, { searchParams: params })
      .json<ListBudgetGenerationsResponse>(),
  getGeneration: (planId: string, gid: string) =>
    apiClient
      .get(`api/budget-plans/${planId}/generations/${gid}`)
      .json<BudgetGenerationDetailResponse>(),
};
