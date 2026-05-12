import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMealPinInput, ListMealPinsQuery } from '@repo/shared';

import { mealPinApi } from '@/lib/api/endpoints/meal-pin';

const queryKey = (planId: string, query: Partial<ListMealPinsQuery>) =>
  ['mealPins', planId, query] as const;

export const useMealPins = (planId: string | undefined, query: Partial<ListMealPinsQuery> = {}) =>
  useQuery({
    queryKey: queryKey(planId ?? 'none', query),
    queryFn: () => mealPinApi.list(planId!, query),
    enabled: !!planId,
  });

/**
 * Invalidate everything that depends on pin state: the pin list, the active
 * plan (its budgetState is pin-adjusted), the per-day suggestions (where pins
 * override AI suggestions), and the plan detail.
 */
function pinInvalidations(queryClient: ReturnType<typeof useQueryClient>, planId: string) {
  queryClient.invalidateQueries({ queryKey: ['mealPins', planId] });
  queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
  queryClient.invalidateQueries({ queryKey: ['budgetPlan', planId] });
  queryClient.invalidateQueries({ queryKey: ['budgetPlanContext', planId] });
  queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
  queryClient.invalidateQueries({ queryKey: ['planTimeline', planId] });
}

export const useCreateMealPin = (planId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMealPinInput) => mealPinApi.create(planId, input),
    onSuccess: () => pinInvalidations(queryClient, planId),
  });
};

export const useDeleteMealPin = (planId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pinId: string) => mealPinApi.delete(planId, pinId),
    onSuccess: () => pinInvalidations(queryClient, planId),
  });
};
