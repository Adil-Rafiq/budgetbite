'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Pin, Sparkles, Utensils } from 'lucide-react';
import { classifyBudgetFit } from '@repo/shared';
import type {
  BudgetPlanDetail,
  BudgetStateContext,
  PlanTimelineDay,
  PlanTimelineSlot,
  SuggestionOption,
} from '@repo/shared';

import { usePlanTimeline } from '@/hooks/use-budget-plan';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import { optionLabel } from '@/lib/suggestion';
import { formatPKR } from '@/lib/currency';
import { BudgetFitBadge } from '@/components/budget-fit-badge';
import { DataError } from '@/components/data-error';
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * Whether a suggested price fits what is left, using the same classifier the
 * dashboard meal decision and the restaurant menus use.
 *
 * This surface printed every price in the same brand green — ₨350 against a
 * ₨400 per-meal target looked exactly like ₨1,800 against it. The one screen
 * where a whole period of AI suggestions is reviewed was the only place in the
 * app that would not say whether a suggestion fit the budget.
 */
function OptionPrice({ option, ctx }: { option: SuggestionOption; ctx: BudgetStateContext }) {
  const fit = classifyBudgetFit({
    itemPrice: option.estimatedPrice,
    avgBudgetPerRemainingMeal: ctx.avgBudgetPerRemainingMeal,
    amountRemaining: ctx.amountRemaining,
  });

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span
        className={`whitespace-nowrap text-right font-display text-[13px] font-semibold tabular-nums ${
          fit === 'red' ? 'text-tomato-ink' : fit === 'amber' ? 'text-amber-ink' : 'text-green-deep'
        }`}
      >
        {formatPKR(option.estimatedPrice)}
      </span>
      <BudgetFitBadge fit={fit} />
    </div>
  );
}

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
    logged: { className: 'bg-green/10 text-green-deep', label: 'Logged', Icon: Check },
    pinned: { className: 'bg-green/10 text-green-deep', label: 'Pinned', Icon: Pin },
    suggested: { className: 'bg-slate/10 text-slate', label: 'Suggested', Icon: Sparkles },
    empty: null,
  };
  const v = map[status];
  if (!v) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${v.className}`}
    >
      <v.Icon className="h-3 w-3" />
      {v.label}
    </span>
  );
}

function LoggedBody({ slot }: { slot: PlanTimelineSlot }) {
  const c = slot.loggedChoice!;
  const title = c.isHomeCooked
    ? (c.manualDescription ?? 'Home-cooked meal')
    : c.isCustom
      ? (c.manualDescription ?? 'Custom entry')
      : (c.menuItemName ?? c.manualDescription ?? '—');

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-green/30 bg-green/[0.05] p-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-charcoal">{title}</p>
        {c.isHomeCooked ? (
          <p className="mt-0.5 truncate text-[11px] text-slate">🍳 Cooked at home</p>
        ) : (
          c.restaurantName && (
            <p className="mt-0.5 truncate text-[11px] text-slate">{c.restaurantName}</p>
          )
        )}
      </div>
      <span className="shrink-0 whitespace-nowrap text-right font-display text-sm font-semibold text-charcoal">
        {formatPKR(c.actualAmountSpent)}
      </span>
    </div>
  );
}

function PinnedBody({ option, ctx }: { option: SuggestionOption; ctx: BudgetStateContext }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-green/30 bg-green/[0.05] p-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-charcoal">{optionLabel(option)}</p>
        {option.restaurantName && (
          <p className="mt-0.5 truncate text-[11px] text-slate">{option.restaurantName}</p>
        )}
      </div>
      <OptionPrice option={option} ctx={ctx} />
    </div>
  );
}

function SuggestedBody({ options, ctx }: { options: SuggestionOption[]; ctx: BudgetStateContext }) {
  return (
    <div className="flex flex-col">
      {options.map((option, i) => (
        <div
          key={option.id}
          className={`flex items-start justify-between gap-3 py-2.5 ${
            i === 0 ? '' : 'border-t border-sage'
          }`}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              aria-hidden
              className="mt-0.5 w-4 shrink-0 text-[11px] tabular-nums text-slate/60"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-charcoal">
                {optionLabel(option)}
              </p>
              {option.restaurantName && (
                <p className="mt-0.5 truncate text-[11px] text-slate">{option.restaurantName}</p>
              )}
            </div>
          </div>
          <OptionPrice option={option} ctx={ctx} />
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
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-sage p-3 text-[12px] text-slate/60">
      <Utensils className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
}

function MealSection({
  slot,
  day,
  ctx,
}: {
  slot: PlanTimelineSlot;
  day: PlanTimelineDay;
  ctx: BudgetStateContext;
}) {
  const { Icon } = getMealTypeVisual(slot.mealTypeKey);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
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
        <StatusBadge status={slot.status} />
      </div>

      {slot.status === 'logged' && <LoggedBody slot={slot} />}
      {slot.status === 'pinned' && slot.options[0] && (
        <PinnedBody option={slot.options[0]} ctx={ctx} />
      )}
      {slot.status === 'suggested' && <SuggestedBody options={slot.options} ctx={ctx} />}
      {slot.status === 'empty' && <EmptyBody relative={day.relative} />}
    </div>
  );
}

function DayCard({ day, ctx }: { day: PlanTimelineDay; ctx: BudgetStateContext }) {
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
    ? 'overflow-hidden rounded-2xl border-[1.5px] border-green bg-white shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-green)_10%,transparent)]'
    : isPast
      ? 'overflow-hidden rounded-2xl border border-sage bg-canvas'
      : 'overflow-hidden rounded-2xl border border-sage bg-white';

  const headerClass = isToday
    ? 'flex items-center justify-between gap-3 border-b border-sage bg-green/[0.06] px-5 py-3.5'
    : 'flex items-center justify-between gap-3 border-b border-sage bg-canvas px-5 py-3.5';

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex min-w-0 items-center gap-2">
          <h3
            className={`truncate font-display text-base font-semibold tracking-tight ${isPast ? 'text-slate' : 'text-charcoal'}`}
          >
            {formatDay(day.slotDate)}
          </h3>
          {isToday && (
            <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-green-deep">
              today
            </span>
          )}
        </div>

        {(counts.logged > 0 || counts.pinned > 0) && (
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate">
            {counts.logged > 0 && (
              <span className="flex items-center gap-1 text-green-deep">
                <Check className="h-3 w-3" />
                {counts.logged} logged
              </span>
            )}
            {counts.pinned > 0 && (
              <span className="flex items-center gap-1 text-green-deep">
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
            {i > 0 && <div className="-mx-1 h-px bg-sage" />}
            <MealSection slot={slot} day={day} ctx={ctx} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBanner({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/60">
        {label}
      </span>
      <span className="text-[11px] text-slate/60">
        {count} day{count === 1 ? '' : 's'}
      </span>
      <div className="h-px flex-1 bg-sage" />
    </div>
  );
}

interface PlanTimelineProps {
  plan: BudgetPlanDetail;
}

export function PlanTimeline({ plan }: PlanTimelineProps) {
  const isPendingGeneration = plan.latestAttempt?.status === 'pending';
  const { data, isLoading, error, refetch } = usePlanTimeline(plan.id, isPendingGeneration);

  /**
   * Past days start folded away.
   *
   * On a phone at 8pm the question is "what am I eating tonight and can I
   * afford it", and the timeline answered it by rendering every day of the
   * period at equal weight and making the user scroll through a week of
   * already-spent money to reach today.
   */
  const [showPast, setShowPast] = useState(false);

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
        <span className="text-xs font-semibold uppercase tracking-widest text-green-deep">
          Timeline
        </span>
        <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
          Day by day
        </h2>
      </div>
      {data && (
        <span className="text-[11px] text-slate/60">
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
            <div key={i} className="h-48 w-full animate-pulse rounded-2xl bg-sage" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <DataError message="We couldn't load this plan's timeline." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="rounded-2xl border border-dashed border-sage bg-white p-6 text-center text-[13px] text-slate">
          No days in this plan yet.
        </div>
      </div>
    );
  }

  const ctx = plan.context;

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* Principle 2: prices are best-effort, never guarantees. This screen
          lays out a whole period of them, so it says so once, up front, rather
          than presenting every estimate as a commitment. */}
      <p className="text-[11px] text-slate/70">
        Prices are estimates from the latest menu data — what you log after ordering is what counts
        against the budget.
      </p>

      {grouped.past.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            className={`flex min-h-11 items-center gap-3 rounded-lg text-left ${FOCUS_RING}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/60">
              Earlier
            </span>
            <span className="text-[11px] text-slate/60">
              {grouped.past.length} day{grouped.past.length === 1 ? '' : 's'}
            </span>
            <ChevronDown
              aria-hidden
              className={`h-3.5 w-3.5 text-slate/60 transition-transform ${showPast ? 'rotate-180' : ''}`}
            />
            <span className="h-px flex-1 bg-sage" />
          </button>

          {showPast && (
            <div className="flex flex-col gap-3">
              {grouped.past.map((day) => (
                <DayCard key={day.slotDate} day={day} ctx={ctx} />
              ))}
            </div>
          )}
        </div>
      )}

      {grouped.today.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Today" count={grouped.today.length} />
          <div className="flex flex-col gap-3">
            {grouped.today.map((day) => (
              <DayCard key={day.slotDate} day={day} ctx={ctx} />
            ))}
          </div>
        </div>
      )}

      {grouped.future.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Coming up" count={grouped.future.length} />
          <div className="flex flex-col gap-3">
            {grouped.future.map((day) => (
              <DayCard key={day.slotDate} day={day} ctx={ctx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
