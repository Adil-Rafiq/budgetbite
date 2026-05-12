'use client';

import type { SubmitHandler, Control } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
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
import { Pill } from '@/components/ui/pill';
import { logSuggestionSchema, logCustomSchema } from '../_schemas/log-meal.schema';
import type { LogSuggestionForm, LogCustomForm } from '../_schemas/log-meal.schema';
import type { LogModalState, SavePayload } from '../_hooks/use-meal-slots';

const labelClass = 'text-[10px] uppercase text-soft';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.18em',
};
const inputClass = 'bg-lumen border-lumen-dk text-vast';

function FeedbackFields<T extends LogSuggestionForm | LogCustomForm>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label className={labelClass} style={labelStyle}>
          Rating
        </Label>
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
                        filled ? 'text-amber' : 'text-lumen-dk'
                      }`}
                      style={{
                        fill: filled ? 'var(--color-amber)' : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className={labelClass} style={labelStyle}>
          Did you enjoy it?
        </Label>
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
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ${
                    v === true
                      ? 'border-fathom bg-fathom/[0.08] text-fathom'
                      : 'border-lumen-dk bg-transparent text-ink'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(v === false ? null : false)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ${
                    v === false
                      ? 'border-pulse bg-pulse/[0.08] text-pulse'
                      : 'border-lumen-dk bg-transparent text-ink'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
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
        <Label htmlFor="comment" className={labelClass} style={labelStyle}>
          Comment{' '}
          <span className="ml-1 normal-case text-soft" style={{ letterSpacing: 0 }}>
            (optional)
          </span>
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

function PrimaryPill({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled: boolean;
}) {
  return (
    <Pill type="submit" size="md" disabled={disabled} className="w-full">
      {children}
      <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
    </Pill>
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
        <Label htmlFor="actual-amount" className={labelClass} style={labelStyle}>
          Actual amount spent (PKR)
        </Label>
        <Input
          id="actual-amount"
          type="number"
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-semibold`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
          }}
        />
        {errors.actualAmountSpent && (
          <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
            {errors.actualAmountSpent.message}
          </p>
        )}
      </div>

      <FeedbackFields control={control} />

      <PrimaryPill disabled={isSaving}>{isSaving ? 'Saving…' : 'Save meal'}</PrimaryPill>
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
        <Label htmlFor="restaurant-name" className={labelClass} style={labelStyle}>
          Restaurant name
        </Label>
        <Input
          id="restaurant-name"
          placeholder="e.g. Burns Road Nihari"
          {...register('restaurantName')}
          className={inputClass}
        />
        {errors.restaurantName && (
          <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
            {errors.restaurantName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-desc" className={labelClass} style={labelStyle}>
          What did you have?
        </Label>
        <Input
          id="manual-desc"
          placeholder="e.g. Nihari with naan"
          {...register('manualDescription')}
          className={inputClass}
        />
        {errors.manualDescription && (
          <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
            {errors.manualDescription.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-amount" className={labelClass} style={labelStyle}>
          Actual amount spent (PKR)
        </Label>
        <Input
          id="custom-amount"
          type="number"
          {...register('actualAmountSpent', { valueAsNumber: true })}
          className={`${inputClass} font-semibold`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
          }}
        />
        {errors.actualAmountSpent && (
          <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
            {errors.actualAmountSpent.message}
          </p>
        )}
      </div>

      <FeedbackFields control={control} />

      <PrimaryPill disabled={isSaving}>{isSaving ? 'Saving…' : 'Save meal'}</PrimaryPill>
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
  const isCustom = state.mode?.type === 'custom';
  const option = state.mode?.type === 'suggestion' ? state.mode.option : null;

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <div
            className="text-[10px] uppercase text-fathom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
          >
            {isCustom ? 'custom · /log' : 'choose · /log'}
          </div>
          <DialogTitle
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {isCustom ? 'Log custom meal' : 'Log your meal'}
          </DialogTitle>
          <DialogDescription className="text-ink">
            {isCustom
              ? 'Enter the details of what you had.'
              : 'Confirm the amount and leave feedback.'}
          </DialogDescription>
        </DialogHeader>

        {option && (
          <div className="rounded-xl border border-lumen-dk bg-lumen p-3">
            <p className="font-medium text-vast">{option.menuItemName ?? '—'}</p>
            <p className="text-[12px] text-ink">{option.restaurantName ?? '—'}</p>
          </div>
        )}

        {isCustom ? (
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
