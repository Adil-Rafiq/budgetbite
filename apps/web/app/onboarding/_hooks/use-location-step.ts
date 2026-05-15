'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showToast } from '@/lib/toast';
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

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

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

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error({ title: 'Geolocation not supported' });
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Truncate to 4 decimal places — ~11m precision, enough for restaurant proximity
        setCoordinates(Number(coords.latitude.toFixed(4)), Number(coords.longitude.toFixed(4)));
        setIsDetectingLocation(false);
        showToast.success({ title: 'Location detected!' });
      },
      (err) => {
        setIsDetectingLocation(false);
        showToast.error({
          title: 'Failed to get location',
          description: err.message || 'Please check your browser permissions or try manually',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

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
