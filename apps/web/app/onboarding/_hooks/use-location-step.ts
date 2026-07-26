'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { locationPreferencesSchema, type LocationPreferencesInput } from '@/app/onboarding/types';
import type { UserProfile } from '@repo/shared';

const isCoordinate = (value: number | null | undefined): value is number =>
  value != null && Number.isFinite(value);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLocationStep = (profile?: UserProfile | null) => {
  const form = useForm<LocationPreferencesInput>({
    // Deliberately empty. The map still *opens* on a default view, but that
    // view is never a submitted value — see DEFAULT_MAP_VIEW in constants.ts.
    defaultValues: { latitude: undefined, longitude: undefined },
    resolver: zodResolver(locationPreferencesSchema),
  });

  const hydratedFromProfile = useRef(false);

  // Hydrate once from a saved profile. Guarded by a ref so a background refetch
  // can never wipe coordinates the user just picked but hasn't submitted.
  useEffect(() => {
    if (hydratedFromProfile.current || !profile) return;
    if (!isCoordinate(profile.latitude) || !isCoordinate(profile.longitude)) return;

    hydratedFromProfile.current = true;
    form.reset({ latitude: profile.latitude, longitude: profile.longitude });
  }, [profile, form]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const setCoordinates = (latitude: number, longitude: number) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    // Any explicit pick counts as hydration — don't let a late profile response
    // overwrite it.
    hydratedFromProfile.current = true;
    form.setValue('latitude', latitude, { shouldValidate: true, shouldDirty: true });
    form.setValue('longitude', longitude, { shouldValidate: true, shouldDirty: true });
  };

  const { detect: detectLocation, isDetecting: isDetectingLocation } = useDetectLocation({
    onSuccess: setCoordinates,
  });

  // ─── Watched values ─────────────────────────────────────────────────────────

  const latitude = form.watch('latitude');
  const longitude = form.watch('longitude');
  const hasPickedLocation = isCoordinate(latitude) && isCoordinate(longitude);

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    handleSubmit: form.handleSubmit,

    values: {
      latitude,
      longitude,
    },

    state: {
      isDetectingLocation,
      hasPickedLocation,
    },

    errors: {
      latitude: form.formState.errors.latitude?.message,
      longitude: form.formState.errors.longitude?.message,
    },

    actions: {
      detectLocation,
      setCoordinates,
    },
  };
};
