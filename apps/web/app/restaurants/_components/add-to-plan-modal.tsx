'use client';

import { useMemo, useState } from 'react';
import type { MealPinResponse } from '@repo/shared';

import { Button } from '@/components/ui/button';
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

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * "Add to plan" modal mounted from the restaurant detail page.
 *
 * Routes the user's intent based on the chosen slotDate:
 *   - slotDate <= today  → POST /meal-choices (logs actual spend; existing
 *     replan-trigger logic kicks in if cumulative variance crosses threshold)
 *   - slotDate >  today  → POST /meal-pins (user-locked future commitment;
 *     survives replans, drops priceAtPin off the AI's per-meal target)
 *
 * Slots that already have a pin are shown as "already pinned" so the user can
 * see what's taken without overwriting accidentally — re-selecting a taken
 * slot upserts the pin (replacing the previous menu item).
 */
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

  // Reset form whenever the modal reopens for a new menu item — keeps the
  // amount aligned with the current item's price and avoids stale slot/state.
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
          description: `PKR ${actualAmount.toLocaleString()} for ${slotDate}`,
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
          <DialogTitle>Add to plan</DialogTitle>
          <DialogDescription>
            {isPastOrToday
              ? 'Log this as a meal you ordered. Your remaining budget updates immediately.'
              : 'Pin this for a future slot. Your AI plan will keep it locked through replans.'}
          </DialogDescription>
        </DialogHeader>

        {/* Selected item summary */}
        <div className="rounded-lg bg-secondary p-3">
          <p className="font-medium text-card-foreground">{menuItem.name}</p>
          <p className="text-sm text-muted-foreground">{restaurantName}</p>
          <p className="text-sm font-semibold text-primary mt-1">
            PKR {menuItem.price.toLocaleString()}
          </p>
        </div>

        {!planId ? (
          <p className="text-sm text-muted-foreground">
            Start a budget plan first to add meals to it.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-date">Date</Label>
              <Input
                id="slot-date"
                type="date"
                value={slotDate}
                min={minDate}
                max={planEnd}
                onChange={(e) => setSlotDate(e.target.value || today)}
              />
            </div>

            {/* Meal type */}
            <div className="flex flex-col gap-2">
              <Label>Meal</Label>
              <Select value={mealTypeId} onValueChange={setMealTypeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((mt) => {
                    const pin = pinsByMealType.get(mt.id);
                    return (
                      <SelectItem key={mt.id} value={mt.id}>
                        <span className="capitalize">{mt.label}</span>
                        {pin && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            already pinned: {pin.menuItemName}
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Actual amount — only relevant when logging (today/past slot). */}
            {isPastOrToday && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="actual-amount">Actual amount spent (PKR)</Label>
                <Input
                  id="actual-amount"
                  type="number"
                  inputMode="numeric"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(Number(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Pre-filled from menu price. Adjust to what you actually paid.
                </p>
              </div>
            )}

            {/* Notes — only on the log path; pins don't carry free-form notes today. */}
            {isPastOrToday && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="meal-notes">
                  Notes <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="meal-notes"
                  rows={2}
                  className="resize-none"
                  placeholder="Anything to remember about this meal?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!planId || !mealTypeId || isSaving}>
            {isSaving
              ? 'Saving…'
              : isPastOrToday
                ? `Log PKR ${actualAmount.toLocaleString()}`
                : 'Pin to plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
