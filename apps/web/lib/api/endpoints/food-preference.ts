import { apiClient } from '@/lib/api/client';
import type {
  DeleteFoodPreferenceInput,
  FoodPreferenceResponse,
  ListFoodPreferencesResponse,
  UpsertFoodPreferenceInput,
} from '@repo/shared';

export const foodPreferenceApi = {
  list: () => apiClient.get('api/food-preferences').json<ListFoodPreferencesResponse>(),

  upsert: (input: UpsertFoodPreferenceInput) =>
    apiClient.post('api/food-preferences', { json: input }).json<FoodPreferenceResponse>(),

  remove: (input: DeleteFoodPreferenceInput) =>
    apiClient.delete('api/food-preferences', { json: input }).then(() => undefined),
};
