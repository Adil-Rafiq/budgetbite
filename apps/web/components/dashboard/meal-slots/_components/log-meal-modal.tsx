'use client';

import type { SubmitHandler, Control } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, ThumbsUp, ThumbsDown, CornerDownLeft } from 'lucide-react';
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

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate';
const inputClass = 'bg-canvas border-sage text-charcoal';
const errorClass = 'text-[11px] text-tomato';

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
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        filled ? 'text-[#f5a623]' : 'text-sage'
                      }`}
                      style={{ fill: filled ? '#f5a623' : 'transparent' }}
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
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                    v === true
                      ? 'border-green bg-green/10 text-dark-green'
                      : 'border-sage bg-transparent text-slate'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(v === false ? null : false)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                    v === false
                      ? 'border-tomato bg-tomato/10 text-tomato'
                      : 'border-sage bg-transparent text-slate'
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
          Comment <span className="ml-1 font-normal normal-case text-slate/60">(optional)</span>
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

function PrimaryButton({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
      <CornerDownLeft className="h-3.5 w-3.5 opacity-70" />
    </button>
  );
}

function SuggestionForm({
  estimatedPrice,
  onSave,
  isSaving,
}: {
  estimatedPrice: number;
  onSave: (p: SavePayload) => void;
  isSaving: boolean;
}) {
  const {
    register,
    control,
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

  return (
    <form
      onSubmit={handleSubmit(onSave as SubmitHandler<LogSuggestionForm>)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="actual-amount" className={labelClass}>
          Actual amount spent (PKR)
        </Label>
        <Input
          id="actual-amount"
          type="number"
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
        {errors.actualAmountSpent && (
          <p className={errorClass}>{errors.actualAmountSpent.message}</p>
        )}
      </div>

      <FeedbackFields control={control} />

      <PrimaryButton disabled={isSaving}>{isSaving ? 'Saving…' : 'Save meal'}</PrimaryButton>
    </form>
  );
}

function CustomForm({ onSave, isSaving }: { onSave: (p: SavePayload) => void; isSaving: boolean }) {
  const {
    register,
    control,
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

  return (
    <form
      onSubmit={handleSubmit(onSave as SubmitHandler<LogCustomForm>)}
      className="flex flex-col gap-4"
    >
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
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
        {errors.actualAmountSpent && (
          <p className={errorClass}>{errors.actualAmountSpent.message}</p>
        )}
      </div>

      <FeedbackFields control={control} />

      <PrimaryButton disabled={isSaving}>{isSaving ? 'Saving…' : 'Save meal'}</PrimaryButton>
    </form>
  );
}

function HomeCookedForm({
  onSave,
  isSaving,
}: {
  onSave: (p: SavePayload) => void;
  isSaving: boolean;
}) {
  const {
    register,
    control,
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

  return (
    <form
      onSubmit={handleSubmit(onSave as SubmitHandler<LogHomeForm>)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="home-desc" className={labelClass}>
          What did you cook?{' '}
          <span className="ml-1 font-normal normal-case text-slate/60">(optional)</span>
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
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
        {errors.actualAmountSpent && (
          <p className={errorClass}>{errors.actualAmountSpent.message}</p>
        )}
      </div>

      <FeedbackFields control={control} />

      <PrimaryButton disabled={isSaving}>{isSaving ? 'Saving…' : 'Save meal'}</PrimaryButton>
    </form>
  );
}

interface Props {
  state: LogModalState;
  onClose: () => void;
  onSave: (payload: SavePayload) => void;
  isSaving: boolean;
}

export function LogMealModal({ state, onClose, onSave, isSaving }: Props) {
  const mode = state.mode?.type;
  const isCustom = mode === 'custom';
  const isHome = mode === 'home';
  const option = state.mode?.type === 'suggestion' ? state.mode.option : null;

  const eyebrow = isHome ? 'Cook at home' : isCustom ? 'Custom entry' : 'Confirm meal';
  const title = isHome ? 'Log a home-cooked meal' : isCustom ? 'Log custom meal' : 'Log your meal';
  const description = isHome
    ? 'You cooked this yourself — just note what it cost.'
    : isCustom
      ? 'Enter the details of what you had.'
      : 'Confirm the amount and leave feedback.';

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <div className="text-xs font-semibold uppercase tracking-widest text-green">
            {eyebrow}
          </div>
          <DialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate">{description}</DialogDescription>
        </DialogHeader>

        {option && (
          <div className="rounded-xl border border-sage bg-canvas p-3">
            <p className="font-medium text-charcoal">{optionLabel(option)}</p>
            <p className="text-[12px] text-slate">{option.restaurantName ?? '—'}</p>
            {option.items.length > 1 && (
              <div className="mt-2 flex flex-col gap-0.5 border-t border-sage pt-2">
                {option.items.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between gap-3">
                    <p className="truncate text-[12px] text-slate">{item.menuItemName ?? '—'}</p>
                    <span className="shrink-0 text-[11px] text-slate/60">
                      ₨ {item.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isHome ? (
          <HomeCookedForm key="home" onSave={onSave} isSaving={isSaving} />
        ) : isCustom ? (
          <CustomForm key="custom" onSave={onSave} isSaving={isSaving} />
        ) : (
          <SuggestionForm
            key={option?.id ?? 'suggestion'}
            estimatedPrice={option?.estimatedPrice ?? 0}
            onSave={onSave}
            isSaving={isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
