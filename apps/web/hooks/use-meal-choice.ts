import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationQuery, RecordMealChoiceInput } from '@repo/shared';

import { mealChoiceApi } from '@/lib/api/endpoints/meal-choice';

export const useMealChoices = (planId: string, params: Partial<PaginationQuery>) =>
  useQuery({
    queryKey: ['mealChoices', planId, params] as const,
    queryFn: () => mealChoiceApi.listByPlan(planId, params),
    enabled: !!planId,
  });

// Invalidate everything a confirmed choice touches: the running budget (active
// plan + context), the day's suggestions, the choice list, the timeline, pins
// (a choice supersedes a pin), and analytics. Shared by record and undo so both
// leave the same caches consistent.
function choiceInvalidations(queryClient: ReturnType<typeof useQueryClient>, planId: string) {
  queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
  queryClient.invalidateQueries({ queryKey: ['budgetPlan', planId] });
  queryClient.invalidateQueries({ queryKey: ['budgetPlanContext', planId] });
  queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
  queryClient.invalidateQueries({ queryKey: ['mealChoices', planId] });
  queryClient.invalidateQueries({ queryKey: ['planTimeline', planId] });
  queryClient.invalidateQueries({ queryKey: ['mealPins', planId] });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
}

export const useRecordMealChoice = (planId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordMealChoiceInput) => mealChoiceApi.record(planId, input),
    onSuccess: () => choiceInvalidations(queryClient, planId),
  });
};

export const useDeleteMealChoice = (planId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choiceId: string) => mealChoiceApi.remove(planId, choiceId),
    onSuccess: () => choiceInvalidations(queryClient, planId),
  });
};
