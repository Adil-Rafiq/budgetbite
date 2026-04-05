import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetPlanApi } from '@/lib/api/budget-plan.api';

// list of all budget plans
export const useBudgetPlans = (params: Parameters<typeof budgetPlanApi.list>[0]) =>
  useQuery({
    queryKey: ['budgetPlans', params],
    queryFn: () => budgetPlanApi.list(params),
  });

// get budget plan by id
export const useBudgetPlanById = (id: string) =>
  useQuery({
    queryKey: ['budgetPlan', id],
    queryFn: () => budgetPlanApi.getById(id),
    enabled: !!id,
  });

// get active budget plan
export const useActiveBudgetPlan = () =>
  useQuery({
    queryKey: ['activeBudgetPlan'],
    queryFn: () => budgetPlanApi.getActive(),
  });

// create a new budget plan
export const useCreateBudgetPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof budgetPlanApi.create>[0]) => budgetPlanApi.create(input),
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
