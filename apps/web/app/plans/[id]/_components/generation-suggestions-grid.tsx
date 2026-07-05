'use client';

import { Loader2 } from 'lucide-react';
import { useBudgetPlanGenerationDetail } from '@/hooks/use-budget-plan';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import { optionLabel } from '@/lib/suggestion';
import type { SuggestionOption, SuggestionSlot } from '@repo/shared';

interface GenerationSuggestionsGridProps {
  planId: string;
  generationId: string;
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
          <div className="h-5 w-32 animate-pulse rounded bg-lumen-dk" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, slotIdx) => (
              <div key={slotIdx} className="h-40 w-full animate-pulse rounded-xl bg-lumen-dk" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GridError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-pulse/20 bg-pulse/[0.06] p-3 text-[13px] text-pulse">
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      <span>{message}</span>
    </div>
  );
}

function SlotCard({ slot }: { slot: SuggestionSlot }) {
  const { Icon } = getMealTypeVisual(slot.mealTypeKey);
  return (
    <div className="flex h-full flex-col rounded-xl border border-lumen-dk bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-fathom/[0.08] text-fathom">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span
          className="text-[10px] uppercase capitalize text-soft"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
        >
          {slot.mealTypeLabel}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {slot.options.length === 0 ? (
          <p className="text-[12px] italic text-soft">No options generated.</p>
        ) : (
          slot.options.map((option: SuggestionOption) => (
            <div
              key={option.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-lumen-dk bg-lumen p-2.5 transition hover:-translate-y-px"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-vast">{optionLabel(option)}</p>
                <p className="truncate text-[11px] text-ink">{option.restaurantName ?? '—'}</p>
              </div>
              <span
                className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-fathom"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ₨ {option.estimatedPrice.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function GenerationSuggestionsGrid({
  planId,
  generationId,
}: GenerationSuggestionsGridProps) {
  const { data, isLoading, error } = useBudgetPlanGenerationDetail(planId, generationId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="flex items-center gap-2 text-[12px] text-ink"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>loading suggestions…</span>
        </div>
        <GridSkeleton />
      </div>
    );
  }

  if (error) {
    return <GridError message={`Failed to load suggestions: ${error.message}`} />;
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-lumen-dk bg-white p-4 text-center text-[13px] text-ink">
        This generation didn&apos;t produce any suggestions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.days.map((day) => (
        <div key={day.slotDate} className="flex flex-col gap-3">
          <h4
            className="text-[13px] font-semibold text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.01em',
            }}
          >
            {formatDay(day.slotDate)}
          </h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {day.slots.map((slot) => (
              <SlotCard key={slot.mealTypeId} slot={slot} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
