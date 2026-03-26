'use client';

import { UseFormReturn } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateUserProfileInput } from '@repo/shared';

interface LocationStepProps {
  form: UseFormReturn<UpdateUserProfileInput>;
}

export const LocationStep = ({ form }: LocationStepProps) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          type="number"
          step="0.0001"
          placeholder="24.8607"
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
