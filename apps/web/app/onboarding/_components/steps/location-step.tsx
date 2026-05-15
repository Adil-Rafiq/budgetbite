'use client';

import dynamic from 'next/dynamic';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { DEFAULT_COORDINATES } from '@/app/onboarding/constants';
import { Pill } from '@/components/ui/pill';

const LocationMap = dynamic(
  () => import('@/components/location-map').then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-2">
        <div className="h-[44px] w-full animate-pulse rounded-[10px] border border-lumen-dk bg-lumen" />
        <div className="h-[280px] w-full animate-pulse rounded-[14px] border border-lumen-dk bg-lumen" />
      </div>
    ),
  },
);

export const LocationStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, state } = steps.location;

  const mapLatitude = values.latitude ?? DEFAULT_COORDINATES.latitude;
  const mapLongitude = values.longitude ?? DEFAULT_COORDINATES.longitude;

  return (
    <div className="flex flex-col gap-5">
      <Pill
        variant="accent"
        size="md"
        onClick={actions.detectLocation}
        disabled={state.isDetectingLocation}
      >
        {state.isDetectingLocation ? (
          <>
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-lumen"
              style={{ borderTopColor: 'transparent' }}
            />
            Detecting…
          </>
        ) : (
          <>
            <span style={{ fontFamily: 'var(--font-mono)' }}>◉</span>
            Use my current location
          </>
        )}
      </Pill>

      <LocationMap
        latitude={mapLatitude}
        longitude={mapLongitude}
        onCoordinatesChange={actions.setCoordinates}
      />
    </div>
  );
};
