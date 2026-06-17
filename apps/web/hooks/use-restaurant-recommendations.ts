import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRestaurantRecommendationInput,
  ListRestaurantRecommendationsQuery,
} from '@repo/shared';

import { restaurantRecommendationApi } from '@/lib/api/endpoints/restaurant-recommendations';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const MY_RECOMMENDATIONS_KEY = ['restaurant-recommendations', 'mine'] as const;

export const useMyRecommendations = (query: Partial<ListRestaurantRecommendationsQuery> = {}) =>
  useQuery({
    queryKey: [...MY_RECOMMENDATIONS_KEY, query] as const,
    queryFn: () => restaurantRecommendationApi.listMine(query),
  });

export const useSubmitRecommendation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRestaurantRecommendationInput) =>
      restaurantRecommendationApi.submit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_RECOMMENDATIONS_KEY });
      showToast.success({
        title: 'Recommendation sent',
        description: 'Thanks! An admin will review it soon.',
      });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not send recommendation',
        description: getErrorMessage(err),
      });
    },
  });
};
