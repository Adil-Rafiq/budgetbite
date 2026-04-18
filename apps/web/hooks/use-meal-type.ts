import { mealTypeApi } from '@/lib/api/endpoints/meal-type';
import { useQuery } from '@tanstack/react-query';

export const useListActiveMealTypes = () => {
  return useQuery({
    queryKey: ['activeMealTypes'],
    queryFn: () => mealTypeApi.listActiveMealTypes(),
  });
};
