'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import {
  createRestaurantRecommendationSchema,
  MAX_PENDING_RESTAURANT_RECOMMENDATIONS,
  type CreateRestaurantRecommendationInput,
} from '@repo/shared';

import {
  useMyRecommendations,
  useSubmitRecommendation,
} from '@/hooks/use-restaurant-recommendations';
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
import { Textarea } from '@/components/ui/textarea';

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
  const submit = useSubmitRecommendation();

  const mine = data?.data ?? [];
  const pendingCount = mine.filter((r) => r.status === 'pending').length;
  const atCap = pendingCount >= MAX_PENDING_RESTAURANT_RECOMMENDATIONS;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    z.input<typeof createRestaurantRecommendationSchema>,
    unknown,
    CreateRestaurantRecommendationInput
  >({
    resolver: zodResolver(createRestaurantRecommendationSchema),
    defaultValues: { name: '', link: undefined, area: undefined, note: undefined },
  });

  const onSubmit = (values: CreateRestaurantRecommendationInput) => {
    submit.mutate(values, {
      onSuccess: () => {
        reset();
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
              Know a great local spot we don’t have yet? Tell us and an admin will review it. You
              can have up to {MAX_PENDING_RESTAURANT_RECOMMENDATIONS} awaiting review at a time.
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
                  Foodpanda link (optional)
                </Label>
                <Input
                  id="rec-link"
                  type="url"
                  placeholder="https://…"
                  {...register('link', { setValueAs: optionalString })}
                />
                {errors.link && <p className={errorClass}>{errors.link.message}</p>}
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="rec-note" className={labelClass} style={labelStyle}>
                  Note (optional)
                </Label>
                <Textarea
                  id="rec-note"
                  rows={3}
                  placeholder="Anything that helps us find it — a dish, why you love it…"
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
