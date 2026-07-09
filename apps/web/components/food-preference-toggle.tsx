'use client';

import { Ban, Heart } from 'lucide-react';
import type { FoodPreferenceTargetType } from '@repo/shared';

import {
  useFoodPreferenceMap,
  useRemoveFoodPreference,
  useUpsertFoodPreference,
} from '@/hooks/use-food-preference';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';

interface FoodPreferenceToggleProps {
  targetType: FoodPreferenceTargetType;
  targetId: string;
  /** Display name — used for accessible labels and toast copy. */
  name: string;
  /** Compact (icon-only) vs regular. Defaults to compact. */
  size?: 'sm' | 'md';
  className?: string;
}

const BTN_SIZE: Record<'sm' | 'md', string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
};

const ICON_SIZE: Record<'sm' | 'md', string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

/**
 * Favorite (heart) + block (ban) toggle for a restaurant or dish. Reads the
 * caller's food-preference list from the shared React Query cache (one request
 * regardless of how many toggles render), so a card just needs the target ids.
 *
 * Semantics: favorites bias the AI planner (soft), blocks are a hard exclusion.
 * Setting one sentiment clears the other; clicking the active one removes it.
 */
export function FoodPreferenceToggle({
  targetType,
  targetId,
  name,
  size = 'sm',
  className,
}: FoodPreferenceToggleProps) {
  const { sentimentOf } = useFoodPreferenceMap();
  const upsert = useUpsertFoodPreference();
  const remove = useRemoveFoodPreference();

  const sentiment = sentimentOf(targetType, targetId);
  const isFavorite = sentiment === 'favorite';
  const isBlocked = sentiment === 'blocked';
  const busy = upsert.isPending || remove.isPending;

  const apply = async (next: 'favorite' | 'blocked') => {
    try {
      if (sentiment === next) {
        await remove.mutateAsync({ targetType, targetId });
      } else {
        await upsert.mutateAsync({ targetType, targetId, sentiment: next });
      }
    } catch (err) {
      showToast.error({ title: 'Could not update preference', description: getErrorMessage(err) });
    }
  };

  const baseBtn =
    'inline-flex items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <button
        type="button"
        disabled={busy}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
        title={isFavorite ? 'Favorited' : 'Favorite'}
        onClick={() => apply('favorite')}
        className={`${baseBtn} ${BTN_SIZE[size]} ${
          isFavorite
            ? 'border-amber bg-amber/[0.12] text-amber'
            : 'border-lumen-dk bg-white text-soft hover:border-amber/50 hover:text-amber'
        }`}
      >
        <Heart
          className={ICON_SIZE[size]}
          style={isFavorite ? { fill: 'currentColor' } : undefined}
        />
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={isBlocked}
        aria-label={isBlocked ? `Unblock ${name}` : `Block ${name}`}
        title={isBlocked ? 'Blocked — never suggested' : 'Block'}
        onClick={() => apply('blocked')}
        className={`${baseBtn} ${BTN_SIZE[size]} ${
          isBlocked
            ? 'border-pulse bg-pulse/[0.10] text-pulse'
            : 'border-lumen-dk bg-white text-soft hover:border-pulse/50 hover:text-pulse'
        }`}
      >
        <Ban className={ICON_SIZE[size]} />
      </button>
    </div>
  );
}
