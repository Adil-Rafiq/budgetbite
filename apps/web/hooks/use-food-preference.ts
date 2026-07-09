import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  DeleteFoodPreferenceInput,
  FoodPreferenceResponse,
  FoodPreferenceSentimentValue,
  FoodPreferenceTargetType,
  UpsertFoodPreferenceInput,
} from '@repo/shared';

import { foodPreferenceApi } from '@/lib/api/endpoints/food-preference';

const QUERY_KEY = ['foodPreferences'] as const;

export const useFoodPreferences = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => foodPreferenceApi.list(),
  });

export const useUpsertFoodPreference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertFoodPreferenceInput) => foodPreferenceApi.upsert(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useRemoveFoodPreference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteFoodPreferenceInput) => foodPreferenceApi.remove(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

/** `${targetType}:${targetId}` → the stored preference, for O(1) lookups in UI. */
export type FoodPreferenceLookup = Map<string, FoodPreferenceResponse>;

export const preferenceKey = (targetType: FoodPreferenceTargetType, targetId: string) =>
  `${targetType}:${targetId}`;

/**
 * Fetch all of the user's favorites/blocks once and expose:
 *  - `lookup`  — key → preference, so a card can show its current sentiment
 *  - `sentimentOf(type, id)` — convenience accessor returning 'favorite' | 'blocked' | null
 *  - the raw list + loading state
 */
export function useFoodPreferenceMap() {
  const query = useFoodPreferences();
  const lookup = useMemo<FoodPreferenceLookup>(() => {
    const map: FoodPreferenceLookup = new Map();
    for (const pref of query.data ?? []) {
      map.set(preferenceKey(pref.targetType, pref.targetId), pref);
    }
    return map;
  }, [query.data]);

  const sentimentOf = (
    targetType: FoodPreferenceTargetType,
    targetId: string,
  ): FoodPreferenceSentimentValue | null =>
    lookup.get(preferenceKey(targetType, targetId))?.sentiment ?? null;

  return { ...query, lookup, sentimentOf };
}
