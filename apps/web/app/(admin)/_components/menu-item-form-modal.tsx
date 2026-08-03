'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMenuItemSchema, type CreateMenuItemInput, type MenuItem } from '@repo/shared';
import { useCreateAdminMenuItem, useUpdateAdminMenuItem } from '@/hooks/use-admin-menu-items';
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

const labelClass = 'font-mono text-[10px] uppercase tracking-[0.18em] text-slate-muted';
const errorClass = 'text-[11px] text-tomato-ink';

// Empty string → undefined so optional fields are omitted, not sent as ''.
const optionalString = (v: unknown) => (v === '' || v == null ? undefined : v);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  menuItem?: MenuItem;
}

export function MenuItemFormModal({ open, onOpenChange, restaurantId, menuItem }: Props) {
  const isEdit = !!menuItem;
  const createItem = useCreateAdminMenuItem(restaurantId);
  const updateItem = useUpdateAdminMenuItem(restaurantId);
  const isSaving = createItem.isPending || updateItem.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof createMenuItemSchema>, unknown, CreateMenuItemInput>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: {
      name: menuItem?.name ?? '',
      price: menuItem?.price ?? undefined,
      description: menuItem?.description ?? undefined,
      imageUrl: menuItem?.imageUrl ?? undefined,
      category: menuItem?.category ?? undefined,
    },
  });

  const onSubmit = (values: CreateMenuItemInput) => {
    const onSuccess = () => onOpenChange(false);
    if (isEdit) {
      updateItem.mutate({ id: menuItem.id, input: values }, { onSuccess });
    } else {
      createItem.mutate(values, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
            {isEdit ? 'Edit menu item' : 'Add menu item'}
          </DialogTitle>
          <DialogDescription className="text-slate">
            {isEdit ? 'Update this menu item.' : 'Add a dish to this restaurant’s menu.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className={labelClass}>
                Name
              </Label>
              <Input id="name" placeholder="e.g. Chicken Karahi" {...register('name')} />
              {errors.name && <p className={errorClass}>{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price" className={labelClass}>
                Price (₨)
              </Label>
              <Input
                id="price"
                type="number"
                step="any"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className={errorClass}>{errors.price.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className={labelClass}>
              Description
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="optional"
              {...register('description', { setValueAs: optionalString })}
            />
            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category" className={labelClass}>
              Section
            </Label>
            <Input
              id="category"
              placeholder="optional — e.g. Starters"
              {...register('category', { setValueAs: optionalString })}
            />
            {/* Grouping is by exact string, so a stray "starters" makes a
                second section next to "Starters" on the public menu. */}
            <p className="text-[11px] text-slate">
              Groups the item on the restaurant page. Must match other items in the same section
              exactly.
            </p>
            {errors.category && <p className={errorClass}>{errors.category.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imageUrl" className={labelClass}>
              Image URL
            </Label>
            <Input
              id="imageUrl"
              placeholder="optional"
              {...register('imageUrl', { setValueAs: optionalString })}
            />
            {errors.imageUrl && <p className={errorClass}>{errors.imageUrl.message}</p>}
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
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
