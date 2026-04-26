import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeedbackInput } from '@repo/shared';

import { feedbackApi } from '@/lib/api/endpoints/feedback';

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FeedbackInput) => feedbackApi.submit(input),
    onSuccess: () => {
      // Feedback feeds server-side preference extraction, which affects future generations.
      queryClient.invalidateQueries({ queryKey: ['mealPlanSuggestions'] });
    },
  });
};
