'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import {
  createRestaurantRecommendationSchema,
  MAX_PENDING_RESTAURANT_RECOMMENDATIONS,
  MAX_RECOMMENDATION_ITEMS,
  type CreateRestaurantRecommendationInput,
} from '@repo/shared';

import {
  useMyRecommendations,
  useSubmitRecommendation,
} from '@/hooks/use-restaurant-recommendations';
import { useUser } from '@/hooks/use-user';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { DEFAULT_COORDINATES } from '@/app/onboarding/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill } from '@/components/ui/pill';
import { Textarea } from '@/components/ui/textarea';

const LocationMap = dynamic(() => import('@/components/location-map').then((m) => m.LocationMap), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full animate-pulse rounded-[14px] border border-lumen-dk bg-lumen" />
  ),
});

const labelClass = 'text-[10px] uppercase text-soft';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.18em',
};
const errorClass = 'text-[11px] text-pulse';

// Empty string → undefined so optional fields are omitted, not sent as ''.
const optionalString = (v: unknown) => (v === '' || v == null ? undefined : v);

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber/[0.12] text-amber',
  approved: 'bg-fathom/10 text-fathom',
  rejected: 'bg-pulse/10 text-pulse',
};

const EMPTY_ITEM = { name: '', price: '', description: undefined };

interface Props {
  className?: string;
  variant?: 'default' | 'outline';
  label?: string;
}

export function RecommendRestaurantButton({
  className,
  variant = 'outline',
  label = 'Recommend a restaurant',
}: Props) {
  const [open, setOpen] = useState(false);
  const { data } = useMyRecommendations({ limit: 20 });
  const { data: currentUser } = useUser();
  const submit = useSubmitRecommendation();

  const mine = data?.data ?? [];
  const pendingCount = mine.filter((r) => r.status === 'pending').length;
  const atCap = pendingCount >= MAX_PENDING_RESTAURANT_RECOMMENDATIONS;

  // Seed the pin at the user's saved location as a convenient starting point —
  // they then drag/search to the restaurant's actual spot (which may be far off).
  const seedLat = currentUser?.profile?.latitude ?? DEFAULT_COORDINATES.latitude;
  const seedLng = currentUser?.profile?.longitude ?? DEFAULT_COORDINATES.longitude;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<
    z.input<typeof createRestaurantRecommendationSchema>,
    unknown,
    CreateRestaurantRecommendationInput
  >({
    resolver: zodResolver(createRestaurantRecommendationSchema),
    defaultValues: {
      name: '',
      link: undefined,
      phone: undefined,
      area: undefined,
      note: undefined,
      latitude: DEFAULT_COORDINATES.latitude,
      longitude: DEFAULT_COORDINATES.longitude,
      items: [{ ...EMPTY_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Re-seed the pin to the user's location each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setValue('latitude', seedLat, { shouldValidate: true });
    setValue('longitude', seedLng, { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setCoordinates = (latitude: number, longitude: number) => {
    setValue('latitude', latitude, { shouldDirty: true, shouldValidate: true });
    setValue('longitude', longitude, { shouldDirty: true, shouldValidate: true });
  };

  const { detect: detectLocation, isDetecting } = useDetectLocation({
    onSuccess: setCoordinates,
  });

  const mapLatitude = watch('latitude') ?? DEFAULT_COORDINATES.latitude;
  const mapLongitude = watch('longitude') ?? DEFAULT_COORDINATES.longitude;

  const onSubmit = (values: CreateRestaurantRecommendationInput) => {
    submit.mutate(values, {
      onSuccess: () => {
        reset({
          name: '',
          link: undefined,
          phone: undefined,
          area: undefined,
          note: undefined,
          latitude: seedLat,
          longitude: seedLng,
          items: [{ ...EMPTY_ITEM }],
        });
        setOpen(false);
      },
    });
  };

  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Recommend a restaurant
            </DialogTitle>
            <DialogDescription className="text-ink">
              Know a great local spot we don’t have yet? Add it with a few menu items and an admin
              will review it. You can have up to {MAX_PENDING_RESTAURANT_RECOMMENDATIONS} awaiting
              review at a time.
            </DialogDescription>
          </DialogHeader>

          {atCap ? (
            <div className="rounded-xl border border-amber/30 bg-amber/[0.06] p-4 text-[13px] text-ink">
              You’ve reached the limit of {MAX_PENDING_RESTAURANT_RECOMMENDATIONS} recommendations
              awaiting review. Once an admin reviews one, you can send another.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rec-name" className={labelClass} style={labelStyle}>
                  Restaurant name
                </Label>
                <Input id="rec-name" placeholder="e.g. Burns Road Nihari" {...register('name')} />
                {errors.name && <p className={errorClass}>{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rec-link" className={labelClass} style={labelStyle}>
                  Order link (optional)
                </Label>
                <Input
                  id="rec-link"
                  type="url"
                  placeholder="https://… (Foodpanda, website, map)"
                  {...register('link', { setValueAs: optionalString })}
                />
                {errors.link && <p className={errorClass}>{errors.link.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rec-phone" className={labelClass} style={labelStyle}>
                  Phone (optional)
                </Label>
                <Input
                  id="rec-phone"
                  type="tel"
                  placeholder="e.g. +92 300 1234567"
                  {...register('phone', { setValueAs: optionalString })}
                />
                {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rec-area" className={labelClass} style={labelStyle}>
                  Area (optional)
                </Label>
                <Input
                  id="rec-area"
                  placeholder="neighbourhood or landmark"
                  {...register('area', { setValueAs: optionalString })}
                />
                {errors.area && <p className={errorClass}>{errors.area.message}</p>}
              </div>

              {/* Location — the restaurant's own spot, not necessarily the user's. */}
              <div className="flex flex-col gap-2">
                <Label className={labelClass} style={labelStyle}>
                  Where is it?
                </Label>
                <p className="text-[12px] text-soft">
                  Drag the pin or search to mark the restaurant’s location — this is where it’ll
                  appear for people nearby.
                </p>
                <Pill
                  type="button"
                  variant="accent"
                  size="md"
                  className="self-start"
                  onClick={detectLocation}
                  disabled={isDetecting}
                >
                  {isDetecting ? (
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
                  onCoordinatesChange={setCoordinates}
                  height={220}
                />
                {(errors.latitude || errors.longitude) && (
                  <p className={errorClass}>Please mark the restaurant’s location on the map.</p>
                )}
              </div>

              {/* Menu items — at least one required so the admin knows what's served. */}
              <div className="flex flex-col gap-2">
                <Label className={labelClass} style={labelStyle}>
                  Menu items
                </Label>
                <div className="flex flex-col gap-2">
                  {fields.map((field, i) => (
                    <div key={field.id} className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Input placeholder="Item name" {...register(`items.${i}.name`)} />
                        </div>
                        <div className="w-28">
                          <Input
                            type="number"
                            step="any"
                            placeholder="₨ price"
                            {...register(`items.${i}.price`)}
                          />
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove item"
                            onClick={() => remove(i)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {(errors.items?.[i]?.name || errors.items?.[i]?.price) && (
                        <p className={errorClass}>
                          {errors.items?.[i]?.name?.message ?? errors.items?.[i]?.price?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {errors.items?.root?.message && (
                  <p className={errorClass}>{errors.items.root.message}</p>
                )}
                {fields.length < MAX_RECOMMENDATION_ITEMS && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => append({ ...EMPTY_ITEM })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add item
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rec-note" className={labelClass} style={labelStyle}>
                  Note (optional)
                </Label>
                <Textarea
                  id="rec-note"
                  rows={2}
                  placeholder="Anything that helps us — opening hours, how to order…"
                  {...register('note', { setValueAs: optionalString })}
                />
                {errors.note && <p className={errorClass}>{errors.note.message}</p>}
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submit.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submit.isPending}>
                  {submit.isPending ? 'Sending…' : 'Send recommendation'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {mine.length > 0 && (
            <div className="mt-1 border-t border-lumen-dk pt-3">
              <p className={labelClass} style={labelStyle}>
                your recommendations
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {mine.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate text-vast">{r.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${STATUS_PILL[r.status]}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
