import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetPlanApi } from '@/lib/api/endpoints/budget-plan';
import { orNull } from '@/lib/api/utils';
import { CreateBudgetPlanInput } from '@repo/shared';

// list of all budget plans
export const useBudgetPlans = (params: Parameters<typeof budgetPlanApi.list>[0]) =>
  useQuery({
    queryKey: ['budgetPlans', params],
    queryFn: () => budgetPlanApi.list(params),
  });

// get budget plan by id
//
// Polls every 2s while the latest generation attempt is still pending so the
// "regenerating…" UX state stays in sync with backend AI work without any
// manual refetch wiring at the call site. Once the attempt reaches a terminal
// state (succeeded / failed / superseded) polling stops automatically.
export const useBudgetPlanById = (id: string) =>
  useQuery({
    queryKey: ['budgetPlan', id],
    queryFn: () => budgetPlanApi.getById(id),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.latestAttempt?.status === 'pending' ? 2000 : false,
  });

// get active budget plan
export const useActiveBudgetPlan = () =>
  useQuery({
    queryKey: ['activeBudgetPlan'],
    queryFn: () => orNull(() => budgetPlanApi.getActive()),
  });

// create a new budget plan
export const useCreateBudgetPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetPlanInput) => budgetPlanApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
    },
  });
};

// update a budget plan
export const useUpdateBudgetPlan = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof budgetPlanApi.update>[1]) =>
      budgetPlanApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlan', id] });
    },
  });
};

// get budget plan context
export const useBudgetPlanContext = (id: string) =>
  useQuery({
    queryKey: ['budgetPlanContext', id],
    queryFn: () => budgetPlanApi.getContext(id),
    enabled: !!id,
  });
