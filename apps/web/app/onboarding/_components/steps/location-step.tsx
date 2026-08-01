'use client';

import dynamic from 'next/dynamic';
import { LocateFixed } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { DEFAULT_MAP_VIEW, ONBOARDING_NEARBY_RADIUS_KM } from '@/app/onboarding/constants';
import { NearbyProof } from '@/components/nearby-proof';
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
