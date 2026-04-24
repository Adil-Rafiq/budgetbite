import { useQuery } from '@tanstack/react-query';

import { mealPlanApi } from '@/lib/api/endpoints/meal-plan';

export const useMealPlanSuggestions = (query: Parameters<typeof mealPlanApi.getSuggestions>[0]) =>
  useQuery({
    queryKey: ['mealPlanSuggestions', query],
    queryFn: () => mealPlanApi.getSuggestions(query),
    enabled: Boolean(query.date),
  });
