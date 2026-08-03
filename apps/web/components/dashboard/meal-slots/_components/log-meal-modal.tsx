'use client';

import { useState } from 'react';
import type { SubmitHandler, Control } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, ThumbsUp, ThumbsDown, CornerDownLeft, TriangleAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { logSuggestionSchema, logCustomSchema, logHomeSchema } from '../_schemas/log-meal.schema';
import type { LogSuggestionForm, LogCustomForm, LogHomeForm } from '../_schemas/log-meal.schema';
import type { LogModalState, SavePayload } from '../_hooks/use-meal-slots';
import { optionLabel } from '@/lib/suggestion';
import { formatPKR } from '@/lib/currency';
import { amountWarning, type LogBudget } from '@/lib/budget-plan/amount-warning';

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate';
const inputClass = 'bg-canvas border-sand-edge text-charcoal';
const errorClass = 'text-[11px] text-tomato-ink';

export type { LogBudget };

function AmountWarning({
  amount,
  budget,
}: {
  amount: number | undefined;
  budget: LogBudget | undefined;
}) {
  const msg = amountWarning(amount, budget);
  if (!msg) return null;
  return (
    <p className="flex items-start gap-1.5 text-[11px] text-tomato-ink" role="status">
      <TriangleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden />
      {msg}
    </p>
  );
}

function FeedbackFields<T extends LogSuggestionForm | LogCustomForm | LogHomeForm>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label className={labelClass}>Rating</Label>
        <Controller
          name={'rating' as never}
          control={control}
          render={({ field }) => (
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < (field.value as number);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => field.onChange(i + 1)}
                    className="p-0.5 transition"
                    aria-label={`Rate ${i + 1} stars`}
                    aria-pressed={filled}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${filled ? 'text-amber' : 'text-sand'}`}
                      style={{ fill: filled ? 'var(--color-amber)' : 'transparent' }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className={labelClass}>Did you enjoy it?</Label>
        <Controller
          name={'liked' as never}
          control={control}
          render={({ field }) => {
            const v = field.value as boolean | null;
            return (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => field.onChange(v === true ? null : true)}
                  aria-pressed={v === true}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                    v === true
                      ? 'border-teal bg-teal/10 text-teal-ink'
                      : 'border-sand bg-transparent text-slate'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(v === false ? null : false)}
                  aria-pressed={v === false}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                    v === false
                      ? 'border-tomato bg-tomato/10 text-tomato-ink'
                      : 'border-sand bg-transparent text-slate'
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  No
                </button>
              </div>
            );
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="comment" className={labelClass}>
          Comment <span className="ml-1 font-normal normal-case text-slate">(optional)</span>
        </Label>
        <Controller
          name={'comment' as never}
          control={control}
          render={({ field }) => (
            <Textarea
              id="comment"
              placeholder="Anything to note about this meal?"
              rows={2}
              className={`resize-none ${inputClass}`}
              {...field}
              value={(field.value as string) ?? ''}
            />
          )}
        />
      </div>
    </>
  );
}

/**
 * Feedback is optional and improves future suggestions, but it shouldn't stand
 * between the user and the one required step (the amount). Tuck it behind a
 * native disclosure — the fields stay mounted, so anything entered still
 * submits, and it's keyboard- and screen-reader-accessible for free.
 */
function FeedbackDisclosure<T extends LogSuggestionForm | LogCustomForm | LogHomeForm>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <details className="rounded-xl border border-sand bg-canvas/60 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-medium text-charcoal [&::-webkit-details-marker]:hidden">
        Add feedback
        <span className="text-[11px] font-normal text-slate">optional · helps future picks</span>
      </summary>
      <div className="mt-4 flex flex-col gap-4">
        <FeedbackFields control={control} />
      </div>
    </details>
  );
}

function PrimaryButton({
  children,
  disabled,
  armed = false,
}: {
  children: React.ReactNode;
  disabled: boolean;
  armed?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-50 ${
        armed ? 'bg-tomato-deep hover:bg-tomato-deep/90' : 'bg-teal-deep hover:bg-teal-deeper'
      }`}
    >
      {children}
      <CornerDownLeft className="h-3.5 w-3.5 opacity-70" />
    </button>
  );
}

/**
 * Hard confirm for an amount that's more than double the per-meal budget — a
 * likely fat-finger that would silently re-plan the rest of the period. The
 * first submit arms the confirm (button turns "Log anyway"); a second submit
 * goes through. Dropping back under the threshold disarms it implicitly.
 */
function useWildOverGuard(budget: LogBudget | undefined, amount: number | undefined) {
  const [armed, setArmed] = useState(false);
  const wildlyOver = !!budget && budget.avgPerMeal > 0 && (amount ?? 0) > budget.avgPerMeal * 2;
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

function AmountField({
  showArmed,
  amount,
  budget,
}: {
  showArmed: boolean;
  amount: number | undefined;
  budget: LogBudget | undefined;
}) {
  if (showArmed) {
    return (
      <p className="flex items-start gap-1.5 text-[11px] font-medium text-tomato-ink">
        <TriangleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden />
        That&apos;s more than double your per-meal budget — tap &ldquo;Log anyway&rdquo; to confirm.
      </p>
    );
  }
  return <AmountWarning amount={amount} budget={budget} />;
}

function SuggestionForm({
  estimatedPrice,
  budget,
  onSave,
  isSaving,
}: {
  estimatedPrice: number;
  budget?: LogBudget;
  onSave: (p: SavePayload) => void;
  isSaving: boolean;
}) {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LogSuggestionForm>({
    resolver: zodResolver(logSuggestionSchema),
    defaultValues: {
      actualAmountSpent: estimatedPrice,
      rating: 0,
      liked: null,
      comment: '',
    },
  });

  const amount = watch('actualAmountSpent');
  const guard = useWildOverGuard(budget, amount);
  const guardedSave: SubmitHandler<LogSuggestionForm> = (data) => {
    if (!guard.gate()) return;
    (onSave as SubmitHandler<LogSuggestionForm>)(data);
  };

  return (
    <form onSubmit={handleSubmit(guardedSave)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="actual-amount" className={labelClass}>
          Actual amount spent (PKR)
        </Label>
        <Input
          id="actual-amount"
          type="number"
          inputMode="numeric"
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
        {errors.actualAmountSpent && (
          <p className={errorClass}>{errors.actualAmountSpent.message}</p>
        )}
        <AmountField showArmed={guard.showArmed} amount={amount} budget={budget} />
      </div>

      <FeedbackDisclosure control={control} />

      <PrimaryButton disabled={isSaving} armed={guard.showArmed}>
        {isSaving ? 'Saving…' : guard.showArmed ? 'Log anyway' : 'Save meal'}
      </PrimaryButton>
    </form>
  );
}

function CustomForm({
  budget,
  onSave,
  isSaving,
}: {
  budget?: LogBudget;
  onSave: (p: SavePayload) => void;
  isSaving: boolean;
}) {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LogCustomForm>({
    resolver: zodResolver(logCustomSchema),
    defaultValues: {
      restaurantName: '',
      manualDescription: '',
      actualAmountSpent: 0,
      rating: 0,
      liked: null,
      comment: '',
    },
  });

  const amount = watch('actualAmountSpent');
  const guard = useWildOverGuard(budget, amount);
  const guardedSave: SubmitHandler<LogCustomForm> = (data) => {
    if (!guard.gate()) return;
    (onSave as SubmitHandler<LogCustomForm>)(data);
  };

  return (
    <form onSubmit={handleSubmit(guardedSave)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="restaurant-name" className={labelClass}>
          Restaurant name
        </Label>
        <Input
          id="restaurant-name"
          placeholder="e.g. Burns Road Nihari"
          {...register('restaurantName')}
          className={inputClass}
        />
        {errors.restaurantName && <p className={errorClass}>{errors.restaurantName.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-desc" className={labelClass}>
          What did you have?
        </Label>
        <Input
          id="manual-desc"
          placeholder="e.g. Nihari with naan"
          {...register('manualDescription')}
          className={inputClass}
        />
        {errors.manualDescription && (
          <p className={errorClass}>{errors.manualDescription.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-amount" className={labelClass}>
          Actual amount spent (PKR)
        </Label>
        <Input
          id="custom-amount"
          type="number"
          inputMode="numeric"
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
        {errors.actualAmountSpent && (
          <p className={errorClass}>{errors.actualAmountSpent.message}</p>
        )}
        <AmountField showArmed={guard.showArmed} amount={amount} budget={budget} />
      </div>

      <FeedbackDisclosure control={control} />

      <PrimaryButton disabled={isSaving} armed={guard.showArmed}>
        {isSaving ? 'Saving…' : guard.showArmed ? 'Log anyway' : 'Save meal'}
      </PrimaryButton>
    </form>
  );
}

function HomeCookedForm({
  budget,
  onSave,
  isSaving,
}: {
  budget?: LogBudget;
  onSave: (p: SavePayload) => void;
  isSaving: boolean;
}) {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LogHomeForm>({
    resolver: zodResolver(logHomeSchema),
    defaultValues: {
      manualDescription: '',
      actualAmountSpent: 0,
      rating: 0,
      liked: null,
      comment: '',
    },
  });

  const amount = watch('actualAmountSpent');
  const guard = useWildOverGuard(budget, amount);
  const guardedSave: SubmitHandler<LogHomeForm> = (data) => {
    if (!guard.gate()) return;
    (onSave as SubmitHandler<LogHomeForm>)(data);
  };

  return (
    <form onSubmit={handleSubmit(guardedSave)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="home-desc" className={labelClass}>
          What did you cook?{' '}
          <span className="ml-1 font-normal normal-case text-slate">(optional)</span>
        </Label>
        <Input
          id="home-desc"
          placeholder="e.g. Chicken karahi & roti"
          {...register('manualDescription')}
          className={inputClass}
        />
        {errors.manualDescription && (
          <p className={errorClass}>{errors.manualDescription.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="home-amount" className={labelClass}>
          Ingredient / cooking cost (PKR)
        </Label>
        <Input
          id="home-amount"
          type="number"
          inputMode="numeric"
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
        {errors.actualAmountSpent && (
          <p className={errorClass}>{errors.actualAmountSpent.message}</p>
        )}
        <AmountField showArmed={guard.showArmed} amount={amount} budget={budget} />
      </div>

      <FeedbackDisclosure control={control} />

      <PrimaryButton disabled={isSaving} armed={guard.showArmed}>
        {isSaving ? 'Saving…' : guard.showArmed ? 'Log anyway' : 'Save meal'}
      </PrimaryButton>
    </form>
  );
}

interface Props {
  state: LogModalState;
  onClose: () => void;
  onSave: (payload: SavePayload) => void;
  isSaving: boolean;
  budget?: LogBudget;
}

export function LogMealModal({ state, onClose, onSave, isSaving, budget }: Props) {
  const mode = state.mode?.type;
  const isCustom = mode === 'custom';
  const isHome = mode === 'home';
  const option = state.mode?.type === 'suggestion' ? state.mode.option : null;

  const eyebrow = isHome ? 'Cook at home' : isCustom ? 'Custom entry' : 'Confirm meal';
  const title = isHome ? 'Log a home-cooked meal' : isCustom ? 'Log custom meal' : 'Log your meal';
  const description = isHome
    ? 'You cooked this yourself — just note what it cost.'
    : isCustom
      ? 'Enter what you had and what it cost.'
      : 'Confirm what you spent. Feedback is optional.';

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-ink">
            {eyebrow}
          </div>
          <DialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate">{description}</DialogDescription>
        </DialogHeader>

        {option && (
          <div className="rounded-xl border border-sand bg-canvas p-3">
            <p className="font-medium text-charcoal">{optionLabel(option)}</p>
            <p className="text-[12px] text-slate">{option.restaurantName ?? '—'}</p>
            {option.items.length > 1 && (
              <div className="mt-2 flex flex-col gap-0.5 border-t border-sand pt-2">
                {option.items.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between gap-3">
                    <p className="truncate text-[12px] text-slate">{item.menuItemName ?? '—'}</p>
                    <span className="shrink-0 text-[11px] text-slate">{formatPKR(item.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isHome ? (
          <HomeCookedForm key="home" budget={budget} onSave={onSave} isSaving={isSaving} />
        ) : isCustom ? (
          <CustomForm key="custom" budget={budget} onSave={onSave} isSaving={isSaving} />
        ) : (
          <SuggestionForm
            key={option?.id ?? 'suggestion'}
            estimatedPrice={option?.estimatedPrice ?? 0}
            budget={budget}
            onSave={onSave}
            isSaving={isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
