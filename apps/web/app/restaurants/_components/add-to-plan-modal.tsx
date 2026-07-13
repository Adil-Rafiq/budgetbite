'use client';

import { useMemo, useState } from 'react';
import type { MealPinResponse } from '@repo/shared';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRecordMealChoice } from '@/hooks/use-meal-choice';
import { useCreateMealPin, useMealPins } from '@/hooks/use-meal-pin';
import { getErrorMessage } from '@/lib/api/errors';
import { localDateString } from '@/lib/date';
import { showToast } from '@/lib/toast';

interface MenuItemPick {
  id: string;
  name: string;
  price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
  menuItem: MenuItemPick;
}

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';
const inputClass = 'bg-canvas border-sage text-charcoal';

export function AddToPlanModal({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  menuItem,
}: Props) {
  const { data: activePlanData } = useActiveBudgetPlan();
  const planId = activePlanData?.plan.id ?? null;

  const today = localDateString();
  const planStart = activePlanData?.plan.startDate ?? today;
  const planEnd = activePlanData?.plan.endDate ?? today;
  const minDate = planStart > today ? planStart : today;

  const [slotDate, setSlotDate] = useState(today);
  const [mealTypeId, setMealTypeId] = useState<string>('');
  const [actualAmount, setActualAmount] = useState<number>(menuItem.price);
  const [notes, setNotes] = useState('');

  const { data: pins } = useMealPins(planId ?? undefined, { slotDate });
  const pinsByMealType = useMemo(
    () => new Map((pins ?? []).map((p) => [p.mealTypeId, p] as const)),
    [pins],
  );

  const { mutateAsync: recordChoice, isPending: isLogging } = useRecordMealChoice(planId ?? '');
  const { mutateAsync: createPin, isPending: isPinning } = useCreateMealPin(planId ?? '');
  const isSaving = isLogging || isPinning;

  const isPastOrToday = slotDate <= today;
  const mealTypes = activePlanData?.plan.mealTypes ?? [];

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSlotDate(today);
      setMealTypeId('');
      setActualAmount(menuItem.price);
      setNotes('');
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!planId || !mealTypeId) return;

    try {
      if (isPastOrToday) {
        await recordChoice({
          slotDate,
          mealTypeId,
          actualAmountSpent: actualAmount,
          restaurantId,
          menuItemId: menuItem.id,
          restaurantName,
          ...(notes.trim() ? { manualDescription: notes.trim() } : {}),
        });
        showToast.success({
          title: 'Meal logged',
          description: `₨ ${actualAmount.toLocaleString()} for ${slotDate}`,
        });
      } else {
        await createPin({
          slotDate,
          mealTypeId,
          restaurantId,
          menuItemId: menuItem.id,
        });
        const existing: MealPinResponse | undefined = pinsByMealType.get(mealTypeId);
        showToast.success({
          title: existing ? 'Pin updated' : 'Pinned to plan',
          description: `${menuItem.name} for ${slotDate}. Your AI plan will keep this slot.`,
        });
      }
      onOpenChange(false);
    } catch (err) {
      showToast.error({
        title: isPastOrToday ? 'Could not log meal' : 'Could not pin to plan',
        description: getErrorMessage(err),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-green">
            {isPastOrToday ? 'Log a meal' : 'Pin to plan'}
          </div>
          <DialogTitle className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
            Add to plan
          </DialogTitle>
          <DialogDescription className="text-slate">
            {isPastOrToday
              ? 'Log this as a meal you ordered. Your budget updates immediately.'
              : 'Pin this for a future slot. Your AI plan will keep it locked.'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-sage bg-canvas p-3">
          <p className="font-medium text-charcoal">{menuItem.name}</p>
          <p className="text-[12px] text-slate">{restaurantName}</p>
          <p className="mt-1 font-display text-base font-semibold text-green">
            ₨ {menuItem.price.toLocaleString()}
          </p>
        </div>

        {!planId ? (
          <p className="text-[13px] text-slate">Start a budget plan first to add meals to it.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-date" className={labelClass}>
                Date
              </Label>
              <Input
                id="slot-date"
                type="date"
                value={slotDate}
                min={minDate}
                max={planEnd}
                onChange={(e) => setSlotDate(e.target.value || today)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className={labelClass}>Meal</Label>
              <Select value={mealTypeId} onValueChange={setMealTypeId}>
                <SelectTrigger className={`w-full ${inputClass}`}>
                  <SelectValue placeholder="Pick a meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((mt) => {
                    const pin = pinsByMealType.get(mt.id);
                    return (
                      <SelectItem key={mt.id} value={mt.id}>
                        <span className="capitalize">{mt.label}</span>
                        {pin && (
                          <span className="ml-2 text-[11px] text-slate/60">
                            already pinned: {pin.menuItemName}
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {isPastOrToday && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="actual-amount" className={labelClass}>
                  Actual amount spent (PKR)
                </Label>
                <Input
                  id="actual-amount"
                  type="number"
                  inputMode="numeric"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(Number(e.target.value) || 0)}
                  className={`${inputClass} font-display text-lg font-semibold`}
                />
                <p className="text-[11px] text-slate/60">Pre-filled from menu. Adjust to actual.</p>
              </div>
            )}

            {isPastOrToday && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="meal-notes" className={labelClass}>
                  Notes (optional)
                </Label>
                <Textarea
                  id="meal-notes"
                  rows={2}
                  className={`resize-none ${inputClass}`}
                  placeholder="Anything to remember?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-lg border border-sage bg-white px-4 py-2 text-[13px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!planId || !mealTypeId || isSaving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving
              ? 'Saving…'
              : isPastOrToday
                ? `Log ₨ ${actualAmount.toLocaleString()}`
                : 'Pin to plan'}
            <span className="opacity-70">↵</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
