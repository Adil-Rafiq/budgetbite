'use client';

import type { SubmitHandler } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { logSuggestionSchema, logCustomSchema } from '../_schemas/log-meal.schema';
import type { LogSuggestionForm, LogCustomForm } from '../_schemas/log-meal.schema';
import type { LogModalState, SavePayload } from '../_hooks/use-meal-slots';

// ─── Shared feedback fields ───────────────────────────────────────────────────

function FeedbackFields({ control }: { control: any }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Rating</Label>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => field.onChange(i + 1)}
                  className="p-0.5"
                  aria-label={`Rate ${i + 1} stars`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      i < field.value ? 'text-chart-4 fill-chart-4' : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Did you enjoy it?</Label>
        <Controller
          name="liked"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => field.onChange(field.value === true ? null : true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  field.value === true
                    ? 'bg-chart-2/10 text-chart-2 border-chart-2/30'
                    : 'border-border text-muted-foreground hover:border-chart-2/30'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Yes
              </button>
              <button
                type="button"
                onClick={() => field.onChange(field.value === false ? null : false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  field.value === false
                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : 'border-border text-muted-foreground hover:border-destructive/30'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                No
              </button>
            </div>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="comment">
          Comment <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <Textarea
              id="comment"
              placeholder="Anything to note about this meal?"
              rows={2}
              className="resize-none"
              {...field}
            />
          )}
        />
      </div>
    </>
  );
}

// ─── Suggestion form ──────────────────────────────────────────────────────────

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
        <Label htmlFor="actual-amount">Actual amount spent (PKR)</Label>
        <Input
          id="actual-amount"
          type="number"
          {...register('actualAmountSpent', { valueAsNumber: true })}
        />
        {errors.actualAmountSpent && (
          <p className="text-xs text-destructive">{errors.actualAmountSpent.message}</p>
        )}
      </div>

      <FeedbackFields control={control} />

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save meal'}
      </Button>
    </form>
  );
}

// ─── Custom form ──────────────────────────────────────────────────────────────

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
        <Label htmlFor="restaurant-name">Restaurant name</Label>
        <Input
          id="restaurant-name"
          placeholder="e.g. Burns Road Nihari"
          {...register('restaurantName')}
        />
        {errors.restaurantName && (
          <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-desc">What did you have?</Label>
        <Input
          id="manual-desc"
          placeholder="e.g. Nihari with naan"
          {...register('manualDescription')}
        />
        {errors.manualDescription && (
          <p className="text-xs text-destructive">{errors.manualDescription.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-amount">Actual amount spent (PKR)</Label>
        <Input
          id="custom-amount"
          type="number"
          {...register('actualAmountSpent', { valueAsNumber: true })}
        />
        {errors.actualAmountSpent && (
          <p className="text-xs text-destructive">{errors.actualAmountSpent.message}</p>
        )}
      </div>

      <FeedbackFields control={control} />

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save meal'}
      </Button>
    </form>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

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
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isCustom ? 'Log custom meal' : 'Log your meal'}
          </DialogTitle>
          <DialogDescription>
            {isCustom
              ? 'Enter the details of what you had.'
              : 'Confirm the amount and leave feedback.'}
          </DialogDescription>
        </DialogHeader>

        {/* Suggestion summary pill */}
        {option && (
          <div className="rounded-lg bg-secondary p-3">
            <p className="font-medium text-card-foreground">{option.menuItemName ?? '—'}</p>
            <p className="text-sm text-muted-foreground">{option.restaurantName ?? '—'}</p>
          </div>
        )}

        {/* Mount the right form — key forces full remount on mode change */}
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
