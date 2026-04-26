import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationQuery, RecordMealChoiceInput } from '@repo/shared';

import { mealChoiceApi } from '@/lib/api/endpoints/meal-choice';

export const useMealChoices = (planId: string, params: Partial<PaginationQuery>) =>
  useQuery({
    queryKey: ['mealChoices', planId, params] as const,
    queryFn: () => mealChoiceApi.listByPlan(planId, params),
    enabled: !!planId,
  });

export const useRecordMealChoice = (planId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordMealChoiceInput) => mealChoiceApi.record(planId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlan', planId] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlanContext', planId] });
      queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['mealChoices', planId] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
