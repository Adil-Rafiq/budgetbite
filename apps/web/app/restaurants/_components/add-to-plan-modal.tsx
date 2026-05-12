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
import { Pill } from '@/components/ui/pill';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRecordMealChoice } from '@/hooks/use-meal-choice';
import { useCreateMealPin, useMealPins } from '@/hooks/use-meal-pin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const MUTED = '#71716a';
const SOFT = '#a6a691';

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

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddToPlanModal({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  menuItem,
}: Props) {
  const { data: activePlanData } = useActiveBudgetPlan();
  const planId = activePlanData?.plan.id ?? null;

  const today = todayString();
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

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    color: SOFT,
    letterSpacing: '0.18em',
  };
  const inputStyle = { background: LUMEN, borderColor: LUMEN_DK, color: VAST };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            {isPastOrToday ? 'log · /meals' : 'pin · /plan'}
          </div>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: VAST,
            }}
          >
            Add to plan
          </DialogTitle>
          <DialogDescription style={{ color: MUTED }}>
            {isPastOrToday
              ? 'Log this as a meal you ordered. Your budget updates immediately.'
              : 'Pin this for a future slot. Your AI plan will keep it locked.'}
          </DialogDescription>
        </DialogHeader>

        {/* Selected item summary */}
        <div
          className="rounded-xl p-3"
          style={{ background: LUMEN, border: `1px solid ${LUMEN_DK}` }}
        >
          <p style={{ color: VAST, fontWeight: 500 }}>{menuItem.name}</p>
          <p className="text-[12px]" style={{ color: MUTED }}>
            {restaurantName}
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 600,
              color: FATHOM,
            }}
          >
            ₨ {menuItem.price.toLocaleString()}
          </p>
        </div>

        {!planId ? (
          <p className="text-[13px]" style={{ color: MUTED }}>
            Start a budget plan first to add meals to it.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-date" className="text-[10px] uppercase" style={labelStyle}>
                Date
              </Label>
              <Input
                id="slot-date"
                type="date"
                value={slotDate}
                min={minDate}
                max={planEnd}
                onChange={(e) => setSlotDate(e.target.value || today)}
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[10px] uppercase" style={labelStyle}>
                Meal
              </Label>
              <Select value={mealTypeId} onValueChange={setMealTypeId}>
                <SelectTrigger className="w-full" style={inputStyle}>
                  <SelectValue placeholder="Pick a meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((mt) => {
                    const pin = pinsByMealType.get(mt.id);
                    return (
                      <SelectItem key={mt.id} value={mt.id}>
                        <span className="capitalize">{mt.label}</span>
                        {pin && (
                          <span className="ml-2 text-[11px]" style={{ color: SOFT }}>
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
                <Label htmlFor="actual-amount" className="text-[10px] uppercase" style={labelStyle}>
                  Actual amount spent (PKR)
                </Label>
                <Input
                  id="actual-amount"
                  type="number"
                  inputMode="numeric"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(Number(e.target.value) || 0)}
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                />
                <p
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
                >
                  pre-filled from menu. adjust to actual.
                </p>
              </div>
            )}

            {isPastOrToday && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="meal-notes" className="text-[10px] uppercase" style={labelStyle}>
                  Notes (optional)
                </Label>
                <Textarea
                  id="meal-notes"
                  rows={2}
                  className="resize-none"
                  placeholder="Anything to remember?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Pill
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Cancel
          </Pill>
          <Pill
            size="sm"
            onClick={handleSubmit}
            disabled={!planId || !mealTypeId || isSaving}
          >
            {isSaving
              ? 'Saving…'
              : isPastOrToday
                ? `Log ₨ ${actualAmount.toLocaleString()}`
                : 'Pin to plan'}
            <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
          </Pill>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
