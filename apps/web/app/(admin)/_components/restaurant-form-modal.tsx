'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRestaurantSchema, type CreateRestaurantInput, type Restaurant } from '@repo/shared';
import { useCreateAdminRestaurant, useUpdateAdminRestaurant } from '@/hooks/use-admin-restaurants';
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

const labelClass = 'text-[10px] uppercase text-soft';
const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' };
const errorClass = 'text-[11px] text-pulse';

// Empty string → undefined so optional fields are omitted instead of coerced to 0.
const optionalNumber = (v: unknown) => (v === '' || v == null ? undefined : Number(v));
const optionalString = (v: unknown) => (v === '' || v == null ? undefined : v);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant?: Restaurant;
}

export function RestaurantFormModal({ open, onOpenChange, restaurant }: Props) {
  const isEdit = !!restaurant;
  const createRestaurant = useCreateAdminRestaurant();
  const updateRestaurant = useUpdateAdminRestaurant();
  const isSaving = createRestaurant.isPending || updateRestaurant.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof createRestaurantSchema>, unknown, CreateRestaurantInput>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      externalId: restaurant?.externalId ?? '',
      name: restaurant?.name ?? '',
      slug: restaurant?.slug ?? undefined,
      phone: restaurant?.phone ?? undefined,
      orderUrl: restaurant?.orderUrl ?? undefined,
      latitude: restaurant?.latitude ?? undefined,
      longitude: restaurant?.longitude ?? undefined,
      deliveryFee: restaurant?.deliveryFee ?? undefined,
      minimumOrder: restaurant?.minimumOrder ?? undefined,
      rating: restaurant?.rating ?? undefined,
      ratingCount: restaurant?.ratingCount ?? undefined,
    },
  });

  const onSubmit = (values: CreateRestaurantInput) => {
    const onSuccess = () => onOpenChange(false);
    if (isEdit) {
      updateRestaurant.mutate({ id: restaurant.id, input: values }, { onSuccess });
    } else {
      createRestaurant.mutate(values, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {isEdit ? 'Edit restaurant' : 'Add restaurant'}
          </DialogTitle>
          <DialogDescription className="text-ink">
            {isEdit
              ? 'Update this restaurant’s details.'
              : 'Create a restaurant manually. Menu items can be managed separately.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className={labelClass} style={labelStyle}>
              Name
            </Label>
            <Input id="name" placeholder="e.g. Burns Road Nihari" {...register('name')} />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="externalId" className={labelClass} style={labelStyle}>
                External ID
              </Label>
              <Input
                id="externalId"
                placeholder="optional · foodpanda id"
                {...register('externalId', { setValueAs: optionalString })}
              />
              {errors.externalId && <p className={errorClass}>{errors.externalId.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug" className={labelClass} style={labelStyle}>
                Slug
              </Label>
              <Input
                id="slug"
                placeholder="optional"
                {...register('slug', { setValueAs: optionalString })}
              />
              {errors.slug && <p className={errorClass}>{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className={labelClass} style={labelStyle}>
                Phone
              </Label>
              <Input
                id="phone"
                placeholder="optional"
                {...register('phone', { setValueAs: optionalString })}
              />
              {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="orderUrl" className={labelClass} style={labelStyle}>
                Order link
              </Label>
              <Input
                id="orderUrl"
                placeholder="optional · https://…"
                {...register('orderUrl', { setValueAs: optionalString })}
              />
              {errors.orderUrl && <p className={errorClass}>{errors.orderUrl.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="latitude" className={labelClass} style={labelStyle}>
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
              />
              {errors.latitude && <p className={errorClass}>{errors.latitude.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="longitude" className={labelClass} style={labelStyle}>
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
              />
              {errors.longitude && <p className={errorClass}>{errors.longitude.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryFee" className={labelClass} style={labelStyle}>
                Delivery fee
              </Label>
              <Input
                id="deliveryFee"
                type="number"
                step="any"
                placeholder="optional"
                {...register('deliveryFee', { setValueAs: optionalNumber })}
              />
              {errors.deliveryFee && <p className={errorClass}>{errors.deliveryFee.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="minimumOrder" className={labelClass} style={labelStyle}>
                Minimum order
              </Label>
              <Input
                id="minimumOrder"
                type="number"
                step="any"
                placeholder="optional"
                {...register('minimumOrder', { setValueAs: optionalNumber })}
              />
              {errors.minimumOrder && <p className={errorClass}>{errors.minimumOrder.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rating" className={labelClass} style={labelStyle}>
                Rating
              </Label>
              <Input
                id="rating"
                type="number"
                step="any"
                placeholder="0–5"
                {...register('rating', { setValueAs: optionalNumber })}
              />
              {errors.rating && <p className={errorClass}>{errors.rating.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ratingCount" className={labelClass} style={labelStyle}>
                Rating count
              </Label>
              <Input
                id="ratingCount"
                type="number"
                placeholder="optional"
                {...register('ratingCount', { setValueAs: optionalNumber })}
              />
              {errors.ratingCount && <p className={errorClass}>{errors.ratingCount.message}</p>}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
