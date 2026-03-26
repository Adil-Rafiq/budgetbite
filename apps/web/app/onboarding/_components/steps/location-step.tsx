'use client';

import { UseFormReturn } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateUserProfileInput } from '@repo/shared';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LocationStepProps {
  form: UseFormReturn<UpdateUserProfileInput>;
}

export const LocationStep = ({ form }: LocationStepProps) => {
  const {
    register,
    formState: { errors },
  } = form;

  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error({ title: 'Geolocation not supported' });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue('latitude', latitude);
        form.setValue('longitude', longitude);
        setLoadingLocation(false);
        showToast.success({ title: 'Location detected!' });
      },
      (err) => {
        setLoadingLocation(false);
        showToast.error({ title: 'Failed to get location', description: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleDetectLocation} variant={'secondary'}>
        Use My Current Location
      </Button>
      <div className="flex flex-col gap-2">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          type="number"
          step="0.0001"
          placeholder="24.8607"
          disabled={loadingLocation}
          {...register('latitude', { valueAsNumber: true })}
        />
        {errors.latitude && <p className="text-destructive text-xs">{errors.latitude.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          type="number"
          step="0.0001"
          placeholder="67.0011"
          disabled={loadingLocation}
          {...register('longitude', { valueAsNumber: true })}
        />
        {errors.longitude && <p className="text-destructive text-xs">{errors.longitude.message}</p>}
      </div>
      <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 inline mr-1" />
        Default: Karachi, Pakistan. Adjust if needed.
      </div>
    </div>
  );
};
