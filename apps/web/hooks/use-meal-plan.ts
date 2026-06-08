import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mealPlanApi } from '@/lib/api/endpoints/meal-plan';
import { getErrorCode, getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

export const useMealPlanSuggestions = (query: Parameters<typeof mealPlanApi.getSuggestions>[0]) =>
  useQuery({
    queryKey: ['mealPlanSuggestions', query],
    queryFn: () => mealPlanApi.getSuggestions(query),
    enabled: Boolean(query.date),
  });

/**
 * Friendly, actionable copy for the precondition errors the generate endpoint
 * can reject with synchronously (before any AI work happens). Anything not
 * listed falls back to the API's own message.
 */
const GENERATION_ERROR_COPY: Record<string, { title: string; description: string }> = {
  NO_NEARBY_RESTAURANTS: {
    title: 'No nearby restaurants found',
    description:
      'We couldn’t find restaurants near your saved location. Try updating your location, or check back once more places are added nearby.',
  },
  NO_REMAINING_DATES: {
    title: 'Nothing left to plan',
    description:
      'Every day in this plan already has meals. Adjust the plan’s dates to generate new suggestions.',
  },
};

export const useGenerateMealPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => mealPlanApi.generate(planId),
    onSuccess: (_data, planId) => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlan', planId] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlanGenerations', planId] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
    },
    onError: (error, planId) => {
      const code = getErrorCode(error);
      // Keep the raw cause in the console for debugging, but never let the user
      // face an unhandled rejection or a cryptic message.
      console.error('Meal plan generation failed', { planId, code, error });
      showToast.error(
        code && GENERATION_ERROR_COPY[code]
          ? GENERATION_ERROR_COPY[code]
          : { title: 'Couldn’t generate your plan', description: getErrorMessage(error) },
      );
    },
  });
};
