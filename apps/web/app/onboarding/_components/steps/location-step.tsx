'use client';

import dynamic from 'next/dynamic';
import { LocateFixed, Store } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { DEFAULT_MAP_VIEW, ONBOARDING_NEARBY_RADIUS_KM } from '@/app/onboarding/constants';
import { useRestaurants } from '@/hooks/use-restaurant';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';

const LocationMap = dynamic(() => import('@/components/location-map').then((m) => m.LocationMap), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2">
      <div className="h-[46px] w-full animate-pulse rounded-xl border border-sage bg-canvas" />
      <div className="h-[280px] w-full animate-pulse rounded-2xl border border-sage bg-canvas" />
    </div>
  ),
});

/**
 * Proof, not assertion. BudgetBite's whole claim is "real, nearby, orderable
 * menus" — so the moment a location exists, show what is actually in the
 * database around it instead of a reverse-geocoded street name the user
 * already knew. Counts and prices here come straight from the same endpoint
 * the restaurants page uses; nothing is estimated.
 */
const NearbyProof = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
  const query = useRestaurants({
    userLat: latitude,
    userLng: longitude,
    maxDistanceKm: ONBOARDING_NEARBY_RADIUS_KM,
    sort: 'distance',
    limit: 3,
  });

  if (query.isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Checking restaurants near you"
        className="h-[68px] animate-pulse rounded-xl border border-sage bg-canvas"
      />
    );
  }

  // A failed lookup is not worth a scary error here — the user can still
  // continue, and the restaurants page will report the real problem later.
  if (query.isError) return null;

  const total = query.data?.meta.total ?? 0;
  const nearest = query.data?.data[0];

  if (total === 0) {
    return (
      <div className="rounded-xl border border-sage bg-canvas px-4 py-3">
        <p className="text-[13px] font-semibold text-charcoal">
          No restaurants here yet, within {ONBOARDING_NEARBY_RADIUS_KM} km
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate">
          You can still finish setup, but suggestions will be thin until we have menus for this
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
          {ONBOARDING_NEARBY_RADIUS_KM} km
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
};

export const LocationStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, state, errors } = steps.location;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-sage bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate">
            Search or drop a pin
          </h2>
          <button
            type="button"
            onClick={actions.detectLocation}
            disabled={state.isDetectingLocation}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-green-deep px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-green-deeper disabled:opacity-60 ${FOCUS_RING}`}
          >
            {state.isDetectingLocation ? (
              <>
                <span
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white"
                  style={{ borderTopColor: 'transparent' }}
                />
                Detecting…
              </>
            ) : (
              <>
                <LocateFixed className="h-3.5 w-3.5" />
                Use my location
              </>
            )}
          </button>
        </div>

        <LocationMap
          latitude={values.latitude}
          longitude={values.longitude}
          fallbackCenter={DEFAULT_MAP_VIEW}
          onCoordinatesChange={actions.setCoordinates}
        />
      </div>

      {state.hasPickedLocation &&
      typeof values.latitude === 'number' &&
      typeof values.longitude === 'number' ? (
        <NearbyProof latitude={values.latitude} longitude={values.longitude} />
      ) : (
        <div className="rounded-xl border border-dashed border-sage bg-white px-4 py-3">
          <p className="text-xs leading-relaxed text-slate">
            We compare this spot against every restaurant we have and only suggest ones within{' '}
            <span className="font-semibold text-charcoal">{ONBOARDING_NEARBY_RADIUS_KM} km</span>.
            It stays on your account and is only used to find nearby menus.
          </p>
        </div>
      )}

      {(errors.latitude || errors.longitude) && (
        <p role="alert" className="text-xs font-medium text-tomato-ink">
          {errors.latitude ?? errors.longitude}
        </p>
      )}
    </div>
  );
};
