'use client';

import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { MealPinResponse } from '@repo/shared';
import { estimateMealCost } from '@repo/shared';

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
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';
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
import { humanizeName } from '@/lib/humanize-name';
import { amountWarning, type LogBudget } from '@/lib/budget-plan/amount-warning';

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
  /** A specific dish, or null to log a whole order from this restaurant. */
  menuItem: MenuItemPick | null;
  deliveryFee?: number | null;
  minimumOrder?: number | null;
}

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate';
const inputClass = 'bg-canvas border-sand-edge text-charcoal';

/**
 * Same guardrail the dashboard's log modal ships: an amount more than double
 * the per-meal budget is more often a fat finger than a feast, and this
 * mutation re-plans the rest of the period from whatever it is told. The first
 * submit arms the confirm, a second one goes through. Dropping back under the
 * threshold disarms it implicitly.
 */
function useWildOverGuard(avgPerMeal: number, amount: number) {
  const [armed, setArmed] = useState(false);
  const wildlyOver = avgPerMeal > 0 && amount > avgPerMeal * 2;
  const showArmed = armed && wildlyOver;
  const gate = (): boolean => {
    if (wildlyOver && !armed) {
      setArmed(true);
      return false;
    }
    return true;
  };
  return { showArmed, gate };
}

export function AddToPlanModal({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  menuItem,
  deliveryFee,
  minimumOrder,
}: Props) {
  const { data: activePlanData } = useActiveBudgetPlan();
  const planId = activePlanData?.plan.id ?? null;
  const avgPerMeal = activePlanData?.budgetState.avgBudgetPerRemainingMeal ?? 0;
  const amountRemaining = activePlanData?.budgetState.amountRemaining ?? 0;
  const mealsRemaining = activePlanData?.budgetState.mealsRemaining ?? 0;
  const budget: LogBudget = {
    avgPerMeal,
    amountRemaining,
    hasBudget: !!activePlanData,
  };

  const today = localDateString();
  const planStart = activePlanData?.plan.startDate ?? today;
  const planEnd = activePlanData?.plan.endDate ?? today;
  const minDate = planStart > today ? planStart : today;

  // The menu price is not the bill. Prefill what the order actually costs to
  // receive so the default value isn't quietly lower than what leaves the
  // user's wallet — they can still correct it to the real total.
  const suggestedAmount = useMemo(
    () =>
      menuItem ? estimateMealCost({ itemPrice: menuItem.price, deliveryFee, minimumOrder }) : 0,
    [menuItem, deliveryFee, minimumOrder],
  );

  const [slotDate, setSlotDate] = useState(today);
  const [mealTypeId, setMealTypeId] = useState<string>('');
  const [actualAmount, setActualAmount] = useState<number>(suggestedAmount);
  const [notes, setNotes] = useState('');

  const { data: pins } = useMealPins(planId ?? undefined, { slotDate });
  const pinsByMealType = useMemo(
    () => new Map((pins ?? []).map((p) => [p.mealTypeId, p] as const)),
    [pins],
  );

  const { mutateAsync: recordChoice, isPending: isLogging } = useRecordMealChoice(planId ?? '');
  const { mutateAsync: createPin, isPending: isPinning } = useCreateMealPin(planId ?? '');
  const isSaving = isLogging || isPinning;

  // Pinning reserves a specific dish for a future slot, so a whole-order log
  // has nothing to pin — those stay in logging mode.
  const canPin = menuItem != null;
  const isPastOrToday = slotDate <= today || !canPin;
  const mealTypes = activePlanData?.plan.mealTypes ?? [];

  const guard = useWildOverGuard(avgPerMeal, actualAmount);
  const warning = amountWarning(actualAmount, budget);

  const handleSubmit = async () => {
    if (!planId || !mealTypeId) return;
    // A ₨0 log is never a real meal; it used to submit cleanly and silently,
    // then re-plan the remaining period from a spend of nothing.
    if (isPastOrToday && actualAmount <= 0) return;
    if (isPastOrToday && !guard.gate()) return;

    try {
      if (isPastOrToday) {
        const description = notes.trim() || (menuItem ? '' : `Order from ${restaurantName}`);
        await recordChoice({
          slotDate,
          mealTypeId,
          actualAmountSpent: actualAmount,
          restaurantId,
          ...(menuItem ? { menuItemId: menuItem.id } : {}),
          restaurantName,
          ...(description ? { manualDescription: description } : {}),
        });
        // The closing beat of the order-then-log loop. It used to read
        // "₨ 640 for 2026-07-31" — a machine timestamp and no consequence — at
        // the exact moment the user most wants to know where they now stand.
        const left = amountRemaining - actualAmount;
        showToast.success({
          title: `Logged ${formatPKR(actualAmount)}`,
          description:
            left >= 0
              ? `${formatPKR(left)} left${afterMeals > 0 ? ` for ${afterMeals} more meal${afterMeals === 1 ? '' : 's'}` : ''}.`
              : `${formatPKR(Math.abs(left))} over budget. The rest of your plan will re-plan from this.`,
        });
      } else if (menuItem) {
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

  // Only meaningful when there's a menu price to explain. On a whole-order log
  // the delivery clause used to survive on its own and render a dangling
  // "+ ₨ 199 delivery" under the restaurant name, next to an amount of 0.
  const costBasis = menuItem
    ? [
        `${formatPKR(menuItem.price)} menu price`,
        minimumOrder != null && menuItem.price < minimumOrder
          ? `raised to the ${formatPKR(minimumOrder)} minimum order`
          : null,
        deliveryFee ? `+ ${formatPKR(deliveryFee)} delivery` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  // What the user is actually deciding: not "is this ₨640" but "what is left
  // after this". The highest-anxiety moment in the product had no answer to
  // that on screen — you handed over the number that re-plans your month and
  // saw only the number itself.
  const afterRemaining = amountRemaining - actualAmount;
  const afterMeals = Math.max(0, mealsRemaining - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-teal-deep">
            {isPastOrToday ? 'Log a meal' : 'Pin to plan'}
          </div>
          {/* Keyed on what the button will actually do, not on whether a dish
              was picked. "Add to plan" over a form that defaults to today and
              commits real spending read as queueing a future meal — the user
              recorded a spend that re-plans their month believing they had
              reserved a slot. */}
          <DialogTitle className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
            {isPastOrToday ? 'Log what you spent' : 'Pin to plan'}
          </DialogTitle>
          <DialogDescription className="text-slate">
            {isPastOrToday
              ? 'Log what you actually paid. Your budget updates immediately and the rest of the plan re-plans from it.'
              : 'Pin this for a future slot. Your AI plan will keep it locked.'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-sand bg-canvas p-3">
          <p className="font-medium text-charcoal">
            {menuItem ? menuItem.name : humanizeName(restaurantName)}
          </p>
          {menuItem && <p className="text-[12px] text-slate">{humanizeName(restaurantName)}</p>}
          {menuItem && (
            <p className="mt-1 font-display text-base font-semibold tabular-nums text-charcoal">
              {formatPKR(suggestedAmount)}
              {suggestedAmount !== menuItem.price && (
                <span className="ml-1.5 text-[11px] font-medium text-slate">delivered</span>
              )}
            </p>
          )}
          {costBasis && <p className="mt-0.5 text-[11px] text-slate">{costBasis}</p>}
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
                max={canPin ? planEnd : today}
                onChange={(e) => setSlotDate(e.target.value || today)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-type" className={labelClass}>
                Meal
              </Label>
              <Select value={mealTypeId} onValueChange={setMealTypeId}>
                <SelectTrigger id="meal-type" className={`w-full ${inputClass}`}>
                  <SelectValue placeholder="Pick a meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((mt) => {
                    const pin = pinsByMealType.get(mt.id);
                    return (
                      <SelectItem key={mt.id} value={mt.id}>
                        <span className="capitalize">{mt.label}</span>
                        {pin && (
                          <span className="ml-2 text-[11px] text-slate">
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
                  min={1}
                  value={actualAmount}
                  onChange={(e) => setActualAmount(Number(e.target.value) || 0)}
                  className={`${inputClass} font-display text-lg font-semibold tabular-nums`}
                  aria-describedby="amount-hint"
                />
                {guard.showArmed ? (
                  <p className="flex items-start gap-1.5 text-[11px] font-medium text-tomato-ink">
                    <TriangleAlert aria-hidden className="mt-px h-3 w-3 shrink-0" />
                    That&apos;s more than double your per-meal budget — tap &ldquo;Log anyway&rdquo;
                    to confirm.
                  </p>
                ) : (
                  <p id="amount-hint" className="text-[11px] text-slate">
                    {menuItem
                      ? 'Estimated from the menu including delivery. Change it to your real total.'
                      : 'Your real total for this order, including delivery.'}
                  </p>
                )}
                {/* The same soft guard the dashboard's log modal ships. This
                    surface had only the 2× fat-finger arm and never mentioned
                    the remaining balance, which is backwards: it is the screen
                    where a user is most likely to be looking at something they
                    cannot afford. */}
                {!guard.showArmed && warning && (
                  <p role="status" className="flex items-start gap-1.5 text-[11px] text-tomato-ink">
                    <TriangleAlert aria-hidden className="mt-px h-3 w-3 shrink-0" />
                    {warning}
                  </p>
                )}
                {budget.hasBudget && actualAmount > 0 && (
                  <p className="text-[11px] tabular-nums text-slate">
                    After logging:{' '}
                    <span
                      className={`font-semibold ${
                        afterRemaining < 0 ? 'text-tomato-ink' : 'text-charcoal'
                      }`}
                    >
                      {formatPKR(Math.abs(afterRemaining))} {afterRemaining < 0 ? 'over' : 'left'}
                    </span>
                    {afterMeals > 0 && afterRemaining > 0 && (
                      <>
                        {' '}
                        for {afterMeals} meal{afterMeals === 1 ? '' : 's'} ·{' '}
                        {formatPKR(Math.round(afterRemaining / afterMeals))} each
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {isPastOrToday && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="meal-notes" className={labelClass}>
                  {menuItem ? 'Notes (optional)' : 'What did you have?'}
                </Label>
                <Textarea
                  id="meal-notes"
                  rows={2}
                  className={`resize-none ${inputClass}`}
                  placeholder={menuItem ? 'Anything to remember?' : 'e.g. Chicken karahi & naan'}
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
            className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-sand bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!planId || !mealTypeId || isSaving || (isPastOrToday && actualAmount <= 0)}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-5 text-[13px] font-semibold text-white transition-colors disabled:pointer-events-none disabled:opacity-50 ${
              guard.showArmed
                ? 'bg-tomato-ink hover:bg-tomato-ink/90'
                : 'bg-teal-deep hover:bg-teal-deeper'
            } ${FOCUS_RING}`}
          >
            {isSaving
              ? 'Saving…'
              : guard.showArmed
                ? 'Log anyway'
                : isPastOrToday
                  ? `Log ${formatPKR(actualAmount)}`
                  : 'Pin to plan'}
            <span aria-hidden className="opacity-70">
              ↵
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
