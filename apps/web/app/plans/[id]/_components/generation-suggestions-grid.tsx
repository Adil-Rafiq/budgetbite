'use client';

import { Loader2 } from 'lucide-react';
import { classifyBudgetFit } from '@repo/shared';
import { useBudgetPlanGenerationDetail } from '@/hooks/use-budget-plan';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import { optionLabel } from '@/lib/suggestion';
import { formatPKR } from '@/lib/currency';
import { BudgetFitBadge } from '@/components/budget-fit-badge';
import { DataError } from '@/components/data-error';
import type { BudgetStateContext, SuggestionOption, SuggestionSlot } from '@repo/shared';

interface GenerationSuggestionsGridProps {
  planId: string;
  generationId: string;
  /** Budget state, so each price can say whether it fits what is left. */
  ctx: BudgetStateContext;
}

const dateFormatter = new Intl.DateTimeFormat('en-PK', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function formatDay(slotDate: string): string {
  return dateFormatter.format(new Date(`${slotDate}T00:00:00`));
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 2 }).map((_, dayIdx) => (
        <div key={dayIdx} className="flex flex-col gap-3">
          <div className="h-5 w-32 animate-pulse rounded bg-sage" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, slotIdx) => (
              <div key={slotIdx} className="h-40 w-full animate-pulse rounded-xl bg-sage" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotCard({ slot, ctx }: { slot: SuggestionSlot; ctx: BudgetStateContext }) {
  const { Icon } = getMealTypeVisual(slot.mealTypeKey);
  return (
    <div className="flex h-full flex-col rounded-xl border border-sage bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <div
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-md bg-green/10 text-green-deep"
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-semibold uppercase capitalize tracking-[0.18em] text-slate/60">
          {slot.mealTypeLabel}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {slot.options.length === 0 ? (
          <p className="text-[12px] italic text-slate/60">No options generated.</p>
        ) : (
          slot.options.map((option: SuggestionOption) => {
            const fit = classifyBudgetFit({
              itemPrice: option.estimatedPrice,
              avgBudgetPerRemainingMeal: ctx.avgBudgetPerRemainingMeal,
              amountRemaining: ctx.amountRemaining,
            });
            return (
              <div
                key={option.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-sage bg-canvas p-2.5 transition hover:-translate-y-px"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-charcoal">
                    {optionLabel(option)}
                  </p>
                  <p className="truncate text-[11px] text-slate">{option.restaurantName ?? '—'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`text-right font-display text-[13px] font-semibold tabular-nums ${
                      fit === 'red'
                        ? 'text-tomato-ink'
                        : fit === 'amber'
                          ? 'text-amber-ink'
                          : 'text-green-deep'
                    }`}
                  >
                    {formatPKR(option.estimatedPrice)}
                  </span>
                  <BudgetFitBadge fit={fit} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function GenerationSuggestionsGrid({
  planId,
  generationId,
  ctx,
}: GenerationSuggestionsGridProps) {
  const { data, isLoading, error, refetch } = useBudgetPlanGenerationDetail(planId, generationId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[12px] text-slate">
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          <span>Loading suggestions…</span>
        </div>
        <GridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <DataError
        message="We couldn't load this attempt's suggestions."
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sage bg-white p-4 text-center text-[13px] text-slate">
        This generation didn&apos;t produce any suggestions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.days.map((day) => (
        <div key={day.slotDate} className="flex flex-col gap-3">
          <h4 className="font-display text-[13px] font-semibold tracking-tight text-charcoal">
            {formatDay(day.slotDate)}
          </h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {day.slots.map((slot) => (
              <SlotCard key={slot.mealTypeId} slot={slot} ctx={ctx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
