import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mealPlanApi } from '@/lib/api/endpoints/meal-plan';

export const useMealPlanSuggestions = (query: Parameters<typeof mealPlanApi.getSuggestions>[0]) =>
  useQuery({
    queryKey: ['mealPlanSuggestions', query],
    queryFn: () => mealPlanApi.getSuggestions(query),
    enabled: Boolean(query.date),
  });

export const useGenerateMealPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => mealPlanApi.generate(planId),
    onSuccess: (_data, planId) => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlan', planId] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
    },
  });
};
