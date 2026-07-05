'use client';

import { useMemo } from 'react';
import { Check, Pin, Sparkles, Utensils } from 'lucide-react';
import type {
  BudgetPlanDetail,
  PlanTimelineDay,
  PlanTimelineSlot,
  SuggestionOption,
} from '@repo/shared';

import { usePlanTimeline } from '@/hooks/use-budget-plan';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import { optionLabel } from '@/lib/suggestion';

const dayFmt = new Intl.DateTimeFormat('en-PK', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

function formatDay(slotDate: string): string {
  return dayFmt.format(new Date(`${slotDate}T12:00:00Z`));
}

function StatusBadge({ status }: { status: PlanTimelineSlot['status'] }) {
  const map: Record<
    PlanTimelineSlot['status'],
    { className: string; label: string; Icon: typeof Check } | null
  > = {
    logged: { className: 'bg-fathom/[0.08] text-fathom', label: 'Logged', Icon: Check },
    pinned: { className: 'bg-fathom/[0.08] text-fathom', label: 'Pinned', Icon: Pin },
    suggested: { className: 'bg-soft/[0.08] text-soft', label: 'Suggested', Icon: Sparkles },
    empty: null,
  };
  const v = map[status];
  if (!v) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase ${v.className}`}
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
    >
      <v.Icon className="h-3 w-3" />
      {v.label}
    </span>
  );
}

function LoggedBody({ slot }: { slot: PlanTimelineSlot }) {
  const c = slot.loggedChoice!;
  const title = c.isCustom
    ? (c.manualDescription ?? 'Custom entry')
    : (c.menuItemName ?? c.manualDescription ?? '—');

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-fathom/20 bg-fathom/[0.03] p-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-vast">{title}</p>
        {c.restaurantName && (
          <p className="mt-0.5 truncate text-[11px] text-ink">{c.restaurantName}</p>
        )}
      </div>
      <span
        className="shrink-0 whitespace-nowrap text-right text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        ₨ {c.actualAmountSpent.toLocaleString()}
      </span>
    </div>
  );
}

function PinnedBody({ option }: { option: SuggestionOption }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-fathom/20 bg-fathom/[0.03] p-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-vast">{optionLabel(option)}</p>
        {option.restaurantName && (
          <p className="mt-0.5 truncate text-[11px] text-ink">{option.restaurantName}</p>
        )}
      </div>
      <span
        className="shrink-0 whitespace-nowrap text-right text-fathom"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        ₨ {option.estimatedPrice.toLocaleString()}
      </span>
    </div>
  );
}

function SuggestedBody({ options }: { options: SuggestionOption[] }) {
  return (
    <div className="flex flex-col">
      {options.map((option, i) => (
        <div
          key={option.id}
          className={`flex items-start justify-between gap-3 py-2.5 ${
            i === 0 ? '' : 'border-t border-lumen-dk'
          }`}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className="mt-0.5 w-4 shrink-0 text-[11px] tabular-nums text-soft"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-vast">{optionLabel(option)}</p>
              {option.restaurantName && (
                <p className="mt-0.5 truncate text-[11px] text-ink">{option.restaurantName}</p>
              )}
            </div>
          </div>
          <span
            className="shrink-0 whitespace-nowrap text-right text-fathom"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ₨ {option.estimatedPrice.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyBody({ relative }: { relative: PlanTimelineDay['relative'] }) {
  const message =
    relative === 'past'
      ? 'No meal logged'
      : relative === 'today'
        ? 'Nothing planned yet'
        : 'No suggestion yet';
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-lumen-dk p-3 text-[12px] text-soft">
      <Utensils className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
}

function MealSection({ slot, day }: { slot: PlanTimelineSlot; day: PlanTimelineDay }) {
  const { Icon } = getMealTypeVisual(slot.mealTypeKey);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
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
        <StatusBadge status={slot.status} />
      </div>

      {slot.status === 'logged' && <LoggedBody slot={slot} />}
      {slot.status === 'pinned' && slot.options[0] && <PinnedBody option={slot.options[0]} />}
      {slot.status === 'suggested' && <SuggestedBody options={slot.options} />}
      {slot.status === 'empty' && <EmptyBody relative={day.relative} />}
    </div>
  );
}

function DayCard({ day }: { day: PlanTimelineDay }) {
  const isToday = day.relative === 'today';
  const isPast = day.relative === 'past';

  const counts = useMemo(() => {
    let logged = 0;
    let pinned = 0;
    for (const s of day.slots) {
      if (s.status === 'logged') logged++;
      else if (s.status === 'pinned') pinned++;
    }
    return { logged, pinned };
  }, [day.slots]);

  const containerClass = isToday
    ? 'overflow-hidden rounded-2xl border-[1.5px] border-fathom bg-white shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-fathom)_7%,transparent)]'
    : isPast
      ? 'overflow-hidden rounded-2xl border border-lumen-dk bg-lumen'
      : 'overflow-hidden rounded-2xl border border-lumen-dk bg-white';

  const headerClass = isToday
    ? 'flex items-center justify-between gap-3 border-b border-lumen-dk bg-fathom/[0.04] px-5 py-3.5'
    : 'flex items-center justify-between gap-3 border-b border-lumen-dk bg-lumen px-5 py-3.5';

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex min-w-0 items-center gap-2">
          <h3
            className={`truncate ${isPast ? 'text-ink' : 'text-vast'}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {formatDay(day.slotDate)}
          </h3>
          {isToday && (
            <span
              className="rounded-full bg-fathom/[0.08] px-2 py-0.5 text-[10px] uppercase text-fathom"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
            >
              today
            </span>
          )}
        </div>

        {(counts.logged > 0 || counts.pinned > 0) && (
          <div
            className="flex shrink-0 items-center gap-3 text-[11px] text-ink"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {counts.logged > 0 && (
              <span className="flex items-center gap-1 text-fathom">
                <Check className="h-3 w-3" />
                {counts.logged} logged
              </span>
            )}
            {counts.pinned > 0 && (
              <span className="flex items-center gap-1 text-fathom">
                <Pin className="h-3 w-3" />
                {counts.pinned} pinned
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 p-5">
        {day.slots.map((slot, i) => (
          <div key={`${day.slotDate}-${slot.mealTypeId}`} className="flex flex-col gap-2.5">
            {i > 0 && <div className="-mx-1 h-px bg-lumen-dk" />}
            <MealSection slot={slot} day={day} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBanner({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] uppercase text-soft"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
      >
        {label}
      </span>
      <span className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
        {count} day{count === 1 ? '' : 's'}
      </span>
      <div className="h-px flex-1 bg-lumen-dk" />
    </div>
  );
}

interface PlanTimelineProps {
  plan: BudgetPlanDetail;
}

export function PlanTimeline({ plan }: PlanTimelineProps) {
  const isPendingGeneration = plan.latestAttempt?.status === 'pending';
  const { data, isLoading, error } = usePlanTimeline(plan.id, isPendingGeneration);

  const grouped = useMemo(() => {
    const past: PlanTimelineDay[] = [];
    const today: PlanTimelineDay[] = [];
    const future: PlanTimelineDay[] = [];
    for (const d of data?.days ?? []) {
      if (d.relative === 'past') past.push(d);
      else if (d.relative === 'today') today.push(d);
      else future.push(d);
    }
    return { past, today, future };
  }, [data]);

  const header = (
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-1">
        <span
          className="text-[10px] uppercase text-fathom"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
        >
          /timeline
        </span>
        <h2
          className="text-vast"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          Day by day
        </h2>
      </div>
      {data && (
        <span className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
          {data.days.length} day{data.days.length === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-2xl bg-lumen" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="flex items-center gap-2 rounded-xl border border-pulse/20 bg-pulse/[0.06] p-3 text-[13px] text-pulse">
          <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
          <span>Failed to load timeline: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="rounded-2xl border border-dashed border-lumen-dk bg-white p-6 text-center text-[13px] text-ink">
          No days in this plan yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {grouped.past.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Past" count={grouped.past.length} />
          <div className="flex flex-col gap-3">
            {grouped.past.map((day) => (
              <DayCard key={day.slotDate} day={day} />
            ))}
          </div>
        </div>
      )}

      {grouped.today.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Today" count={grouped.today.length} />
          <div className="flex flex-col gap-3">
            {grouped.today.map((day) => (
              <DayCard key={day.slotDate} day={day} />
            ))}
          </div>
        </div>
      )}

      {grouped.future.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Coming up" count={grouped.future.length} />
          <div className="flex flex-col gap-3">
            {grouped.future.map((day) => (
              <DayCard key={day.slotDate} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
