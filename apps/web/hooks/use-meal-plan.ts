import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RerollSlotInput } from '@repo/shared';

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

const REROLL_ERROR_COPY: Record<string, { title: string; description: string }> = {
  SLOT_REROLL_LIMIT_REACHED: {
    title: 'Reroll limit reached',
    description:
      'This slot has been rerolled the maximum number of times. Pick one of the options, log your own meal, or regenerate the whole plan.',
  },
  RATE_LIMITED: {
    title: 'Too many rerolls',
    description: 'You have rerolled too many times in a short period. Wait a bit and try again.',
  },
  SLOT_PINNED: {
    title: 'Slot is pinned',
    description: 'Unpin this meal first to get new suggestions for it.',
  },
  SLOT_NOT_OPEN: {
    title: 'Slot can’t be rerolled',
    description: 'This meal is no longer open for new suggestions.',
  },
  SLOT_ALREADY_LOGGED: {
    title: 'Meal already logged',
    description: 'You’ve already logged this meal, so its suggestions can’t be rerolled.',
  },
  NO_ACTIVE_GENERATION: {
    title: 'No plan generated yet',
    description: 'Generate meal suggestions for this plan first, then reroll individual slots.',
  },
};

/**
 * Regenerate the 3 options for one meal slot. Synchronous — the fresh options
 * come back in the response, so on success we refresh every read model that
 * embeds slot suggestions (day view + plan timeline).
 */
export const useRerollSlot = (planId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RerollSlotInput) => mealPlanApi.rerollSlot(planId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['planTimeline', planId] });
    },
    onError: (error, input) => {
      const code = getErrorCode(error);
      console.error('Slot reroll failed', { planId, input, code, error });
      showToast.error(
        code && REROLL_ERROR_COPY[code]
          ? REROLL_ERROR_COPY[code]
          : { title: 'Couldn’t get new suggestions', description: getErrorMessage(error) },
      );
    },
  });
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
