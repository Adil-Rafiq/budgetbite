'use client';

import dynamic from 'next/dynamic';
import { LocateFixed } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { DEFAULT_COORDINATES } from '@/app/onboarding/constants';

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
  const { values, actions, state } = steps.location;

  const mapLatitude = values.latitude ?? DEFAULT_COORDINATES.latitude;
  const mapLongitude = values.longitude ?? DEFAULT_COORDINATES.longitude;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-sage bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Search or drop a pin
          </p>
          <button
            type="button"
            onClick={actions.detectLocation}
            disabled={state.isDetectingLocation}
            className="inline-flex items-center gap-2 rounded-lg bg-green px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-dark-green disabled:opacity-60"
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
                Detect
              </>
            )}
          </button>
        </div>

        <LocationMap
          latitude={mapLatitude}
          longitude={mapLongitude}
          onCoordinatesChange={actions.setCoordinates}
        />
      </div>
    </div>
  );
};
