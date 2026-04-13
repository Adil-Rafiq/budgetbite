'use client';

import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';

export const LocationStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors, state } = steps.location;

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        onClick={actions.detectLocation}
        variant="secondary"
        disabled={state.isDetectingLocation}
        className="flex items-center gap-2"
      >
        {state.isDetectingLocation ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        {state.isDetectingLocation ? 'Detecting...' : 'Use My Current Location'}
      </Button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          type="number"
          step="0.0001"
          placeholder="24.8607"
          disabled={state.isDetectingLocation}
          value={values.latitude ?? ''}
          onChange={(event) => actions.setLatitude(Number(event.target.value))}
        />
        {errors.latitude ? <p className="text-destructive text-xs">{errors.latitude}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          type="number"
          step="0.0001"
          placeholder="67.0011"
          disabled={state.isDetectingLocation}
          value={values.longitude ?? ''}
          onChange={(event) => actions.setLongitude(Number(event.target.value))}
        />
        {errors.longitude ? <p className="text-destructive text-xs">{errors.longitude}</p> : null}
      </div>
      <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 inline mr-1" />
        Default: Karachi, Pakistan. Adjust if needed.
      </div>
    </div>
  );
};
