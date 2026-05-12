'use client';

import { Loader2 } from 'lucide-react';
import { useBudgetPlanGenerationDetail } from '@/hooks/use-budget-plan';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import type { SuggestionOption, SuggestionSlot } from '@repo/shared';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

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
          <div className="h-5 w-32 animate-pulse rounded" style={{ background: LUMEN_DK }} />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, slotIdx) => (
              <div
                key={slotIdx}
                className="h-40 w-full animate-pulse rounded-xl"
                style={{ background: LUMEN_DK }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GridError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl p-3 text-[13px]"
      style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}33`, color: PULSE }}
    >
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      <span>{message}</span>
    </div>
  );
}

function SlotCard({ slot }: { slot: SuggestionSlot }) {
  const { Icon } = getMealTypeVisual(slot.mealTypeKey);
  return (
    <div
      className="flex h-full flex-col rounded-xl p-4"
      style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: `${FATHOM}14`, color: FATHOM }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span
          className="text-[10px] uppercase capitalize"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
        >
          {slot.mealTypeLabel}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {slot.options.length === 0 ? (
          <p className="text-[12px] italic" style={{ color: SOFT }}>
            No options generated.
          </p>
        ) : (
          slot.options.map((option: SuggestionOption) => (
            <div
              key={option.id}
              className="flex items-start justify-between gap-3 rounded-lg p-2.5 transition hover:translate-y-[-1px]"
              style={{ background: LUMEN, border: `1px solid ${LUMEN_DK}` }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px]"
                  style={{ color: VAST, fontWeight: 500 }}
                >
                  {option.menuItemName ?? '—'}
                </p>
                <p className="truncate text-[11px]" style={{ color: MUTED }}>
                  {option.restaurantName ?? '—'}
                </p>
              </div>
              <span
                className="shrink-0 text-right text-[13px] tabular-nums"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  color: FATHOM,
                }}
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
          className="flex items-center gap-2 text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
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
      <div
        className="rounded-xl p-4 text-center text-[13px]"
        style={{ background: WHITE, border: `1px dashed ${LUMEN_DK}`, color: MUTED }}
      >
        This generation didn&apos;t produce any suggestions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.days.map((day) => (
        <div key={day.slotDate} className="flex flex-col gap-3">
          <h4
            className="text-[13px]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: VAST,
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
