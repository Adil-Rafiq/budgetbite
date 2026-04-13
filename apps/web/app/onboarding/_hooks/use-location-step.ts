'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showToast } from '@/lib/toast';
import { DEFAULT_COORDINATES } from '@/app/onboarding/constants';
import { locationPreferencesSchema, type LocationPreferencesInput } from '@/app/onboarding/types';

interface SessionProfileLike {
  latitude?: number | null;
  longitude?: number | null;
}

export const useLocationStep = (profile?: SessionProfileLike | null) => {
  const locationForm = useForm<LocationPreferencesInput>({
    resolver: zodResolver(locationPreferencesSchema),
    defaultValues: {
      latitude: profile?.latitude ?? DEFAULT_COORDINATES.latitude,
      longitude: profile?.longitude ?? DEFAULT_COORDINATES.longitude,
    },
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (!profile) return;

    locationForm.reset({
      latitude: profile.latitude ?? DEFAULT_COORDINATES.latitude,
      longitude: profile.longitude ?? DEFAULT_COORDINATES.longitude,
    });
  }, [profile, locationForm]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error({ title: 'Geolocation not supported' });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        locationForm.setValue('latitude', Number(latitude.toFixed(4)), {
          shouldValidate: true,
          shouldDirty: true,
        });
        locationForm.setValue('longitude', Number(longitude.toFixed(4)), {
          shouldValidate: true,
          shouldDirty: true,
        });
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

  const latitude = locationForm.watch('latitude');
  const longitude = locationForm.watch('longitude');
  const normalizeCoordinateInput = (value: number) => (Number.isFinite(value) ? value : undefined);

  return {
    form: locationForm,
    values: {
      latitude,
      longitude,
    },
    errors: {
      latitude: locationForm.formState.errors.latitude?.message,
      longitude: locationForm.formState.errors.longitude?.message,
    },
    state: {
      isDetectingLocation,
    },
    actions: {
      detectLocation,
      setLatitude: (value: number) =>
        locationForm.setValue('latitude', normalizeCoordinateInput(value), {
          shouldValidate: true,
          shouldDirty: true,
        }),
      setLongitude: (value: number) =>
        locationForm.setValue('longitude', normalizeCoordinateInput(value), {
          shouldValidate: true,
          shouldDirty: true,
        }),
    },
  };
};
