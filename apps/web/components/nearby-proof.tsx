'use client';

import { Store } from 'lucide-react';

import { useRestaurants } from '@/hooks/use-restaurant';
import { formatPKR } from '@/lib/currency';
import { NEARBY_PROOF_RADIUS_KM } from '@/lib/nearby';

/**
 * Proof, not assertion. BudgetBite's whole claim is "real, nearby, orderable
 * menus" — so the moment a location exists, show what is actually in the
 * database around it instead of a reverse-geocoded street name the user
 * already knew. Counts and prices here come straight from the same endpoint
 * the restaurants page uses; nothing is estimated.
 *
 * Lives here rather than inside the onboarding step because changing your
 * location later carries the same consequence as picking it the first time,
 * and the profile surface was shipping that decision with no evidence at all.
 */

/** Shared lookup so a caller can compare two locations before committing one. */
export function useNearbyCount(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  const enabled = typeof latitude === 'number' && typeof longitude === 'number';
  const query = useRestaurants(
    {
      userLat: latitude ?? 0,
      userLng: longitude ?? 0,
      maxDistanceKm: NEARBY_PROOF_RADIUS_KM,
      sort: 'distance',
      limit: 3,
    },
    enabled,
  );

  // `useRestaurants` sets `placeholderData: keepPreviousData`, so moving the pin
  // changes the query key and TanStack hands back the *previous* location's
  // rows with `status: 'success'`. Reading `isPending` alone therefore reported
  // the old spot's count as the new one's, with no loading state, in the panel
  // and in the confirm dialog — the one place this product promised proof was
  // the one place it could quote a number that was not about the pin on screen.
  const isSettling = query.isPending || query.isPlaceholderData;

  // `null` means "we do not know", and it is not the same as zero. Falling back
  // to `?? 0` turned a failed lookup into "0 restaurants deliver here" stated as
  // fact, which is exactly the invented number the product forbids.
  const total = query.isError || isSettling ? null : (query.data?.meta.total ?? 0);

  return {
    enabled,
    isLoading: enabled && isSettling,
    isError: query.isError,
    total,
    nearest: isSettling ? undefined : query.data?.data[0],
  };
}

export function NearbyProof({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { isLoading, isError, total, nearest } = useNearbyCount(latitude, longitude);

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Checking restaurants near you"
        className="h-[68px] animate-pulse rounded-xl border border-sage bg-canvas"
      />
    );
  }

  // Say we don't know, rather than showing nothing or a zero. Silence here read
  // as "no proof needed"; a zero read as "nothing delivers to this address".
  if (isError || total === null) {
    return (
      <div className="rounded-xl border border-dashed border-sage bg-canvas px-4 py-3">
        <p className="text-[13px] font-semibold text-charcoal">
          We couldn&apos;t check what delivers here
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate">
          The spot itself is fine to save — we just couldn&apos;t reach the restaurant list to count
          them. Try again in a moment.
        </p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-sage bg-canvas px-4 py-3">
        <p className="text-[13px] font-semibold text-charcoal">
          No restaurants here yet, within {NEARBY_PROOF_RADIUS_KM} km
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate">
          You can still save this spot, but suggestions will be thin until we have menus for this
          area. Try a spot closer to a city centre if you order from one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-green/40 bg-green/5 px-4 py-3">
      <span
        aria-hidden
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-deep text-white"
      >
        <Store className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-charcoal">
          {total} {total === 1 ? 'restaurant delivers' : 'restaurants deliver'} within{' '}
          {NEARBY_PROOF_RADIUS_KM} km
        </p>
        {nearest && (
          <p className="mt-0.5 truncate text-xs text-slate">
            Closest: {nearest.name}
            {typeof nearest.distanceKm === 'number' && ` · ${nearest.distanceKm.toFixed(1)} km`}
            {typeof nearest.minItemPrice === 'number' &&
              ` · from ${formatPKR(nearest.minItemPrice)}`}
          </p>
        )}
      </div>
    </div>
  );
}
