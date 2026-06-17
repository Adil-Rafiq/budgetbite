import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ListRestaurantRecommendationsQuery,
  ReviewRestaurantRecommendationInput,
} from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const ADMIN_RECOMMENDATIONS_KEY = ['admin', 'recommendations'] as const;

export const useAdminRecommendations = (query: Partial<ListRestaurantRecommendationsQuery>) =>
  useQuery({
    queryKey: [...ADMIN_RECOMMENDATIONS_KEY, query] as const,
    queryFn: () => adminApi.listRestaurantRecommendations(query),
  });

export const useReviewRecommendation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewRestaurantRecommendationInput }) =>
      adminApi.reviewRestaurantRecommendation(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RECOMMENDATIONS_KEY });
      showToast.success({
        title:
          variables.input.status === 'approved'
            ? 'Recommendation approved'
            : 'Recommendation rejected',
      });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not update recommendation',
        description: getErrorMessage(err),
      });
    },
  });
};
