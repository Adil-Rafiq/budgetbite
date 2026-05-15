'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { DEFAULT_COORDINATES } from '@/app/onboarding/constants';
import { locationPreferencesSchema, type LocationPreferencesInput } from '@/app/onboarding/types';
import type { UserProfile } from '@repo/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeCoordinate = (value: number | null | undefined, fallback: number): number =>
  value != null && Number.isFinite(value) ? value : fallback;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLocationStep = (profile?: UserProfile | null) => {
  const form = useForm<LocationPreferencesInput>({
    resolver: zodResolver(locationPreferencesSchema),
    defaultValues: {
      latitude: normalizeCoordinate(profile?.latitude, DEFAULT_COORDINATES.latitude),
      longitude: normalizeCoordinate(profile?.longitude, DEFAULT_COORDINATES.longitude),
    },
  });

  // Sync form with profile when it loads or changes
  useEffect(() => {
    if (!profile) return;
    form.reset({
      latitude: normalizeCoordinate(profile.latitude, DEFAULT_COORDINATES.latitude),
      longitude: normalizeCoordinate(profile.longitude, DEFAULT_COORDINATES.longitude),
    });
  }, [profile, form]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const setCoordinates = (latitude: number, longitude: number) => {
    form.setValue('latitude', Number.isFinite(latitude) ? latitude : undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue('longitude', Number.isFinite(longitude) ? longitude : undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const { detect: detectLocation, isDetecting: isDetectingLocation } = useDetectLocation({
    onSuccess: setCoordinates,
  });

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    handleSubmit: form.handleSubmit,

    values: {
      latitude: form.watch('latitude'),
      longitude: form.watch('longitude'),
    },

    state: {
      isDetectingLocation,
    },

    actions: {
      detectLocation,
      setCoordinates,
    },
  };
};
