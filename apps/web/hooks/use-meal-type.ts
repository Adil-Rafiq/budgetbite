import { mealTypeApi } from '@/lib/api/meal-type.api';
import { useQuery } from '@tanstack/react-query';

export const useListActiveMealTypes = () => {
  return useQuery({
    queryKey: ['activeMealTypes'],
    queryFn: () => mealTypeApi.listActiveMealTypes(),
  });
};
