import { apiClient } from '@/lib/api/client';
import type { MealType } from '@repo/shared';

export const mealTypeApi = {
  listActiveMealTypes: () => apiClient.get('api/meal-types').json<MealType[]>(),
};
