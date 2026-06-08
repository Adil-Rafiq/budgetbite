'use client';

import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMealTypeSchema, type CreateMealTypeInput, type MealType } from '@repo/shared';
import { useCreateAdminMealType, useUpdateAdminMealType } from '@/hooks/use-admin-meal-types';
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
import { Switch } from '@/components/ui/switch';

const labelClass = 'text-[10px] uppercase text-soft';
const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' };
const errorClass = 'text-[11px] text-pulse';

const optionalNumber = (v: unknown) => (v === '' || v == null ? undefined : Number(v));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType?: MealType;
}

export function MealTypeFormModal({ open, onOpenChange, mealType }: Props) {
  const isEdit = !!mealType;
  const createMealType = useCreateAdminMealType();
  const updateMealType = useUpdateAdminMealType();
  const isSaving = createMealType.isPending || updateMealType.isPending;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof createMealTypeSchema>, unknown, CreateMealTypeInput>({
    resolver: zodResolver(createMealTypeSchema),
    defaultValues: {
      key: mealType?.key ?? '',
      label: mealType?.label ?? '',
      sortOrder: mealType?.sortOrder ?? undefined,
      active: mealType?.active ?? true,
    },
  });

  const onSubmit = (values: CreateMealTypeInput) => {
    const onSuccess = () => onOpenChange(false);
    if (isEdit) {
      updateMealType.mutate({ id: mealType.id, input: values }, { onSuccess });
    } else {
      createMealType.mutate(values, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            {isEdit ? 'Edit meal type' : 'Add meal type'}
          </DialogTitle>
          <DialogDescription className="text-ink">
            {isEdit ? 'Update this meal type.' : 'Create a meal type users can plan around.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="label" className={labelClass} style={labelStyle}>
              Label
            </Label>
            <Input id="label" placeholder="e.g. Breakfast" {...register('label')} />
            {errors.label && <p className={errorClass}>{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="key" className={labelClass} style={labelStyle}>
                Key
              </Label>
              <Input
                id="key"
                placeholder="e.g. breakfast"
                style={{ fontFamily: 'var(--font-mono)' }}
                {...register('key')}
              />
              {errors.key && <p className={errorClass}>{errors.key.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sortOrder" className={labelClass} style={labelStyle}>
                Sort order
              </Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="optional"
                {...register('sortOrder', { setValueAs: optionalNumber })}
              />
              {errors.sortOrder && <p className={errorClass}>{errors.sortOrder.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-lumen-dk px-3 py-2.5">
            <Label htmlFor="active" className={labelClass} style={labelStyle}>
              Active
            </Label>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch
                  id="active"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              )}
            />
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
