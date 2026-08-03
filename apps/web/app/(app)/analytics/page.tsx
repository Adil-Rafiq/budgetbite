'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  Bar as RechartsBar,
  BarChart,
  type BarProps,
  CartesianGrid,
  Cell,
  Line as RechartsLine,
  LineChart,
  type LineProps,
  ReferenceLine as RechartsReferenceLine,
  type ReferenceLineProps,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
  XAxis as RechartsXAxis,
  type XAxisProps,
  YAxis as RechartsYAxis,
  type YAxisProps,
} from 'recharts';

// recharts 2.x's class-component exports don't satisfy React 19's stricter
// JSX.ElementType constraint (fixed upstream only in recharts 3, a breaking
// major bump) — cast the affected ones back to a plain component type.
const Bar = RechartsBar as unknown as React.FC<BarProps>;
const Line = RechartsLine as unknown as React.FC<LineProps>;
const ReferenceLine = RechartsReferenceLine as unknown as React.FC<ReferenceLineProps>;
const Tooltip = RechartsTooltip as unknown as React.FC<TooltipProps<number, string>>;
const XAxis = RechartsXAxis as unknown as React.FC<XAxisProps>;
const YAxis = RechartsYAxis as unknown as React.FC<YAxisProps>;

import { ChartSkeleton, TableSkeleton } from '@/components/skeletons';
import { DataError } from '@/components/data-error';
import { FadeUp, Stagger, StaggerItem } from '@/components/motion';

import { useActiveBudgetPlan, useBudgetPlans } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { useMealHistory, useSpendingAnalytics } from '@/hooks/use-analytics';
import { formatPKR, formatPKRCompact } from '@/lib/currency';
import { localDateString } from '@/lib/date';
import { humanizeName } from '@/lib/humanize-name';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import { planTitle } from '@/lib/budget-plan/labels';
import {
  getSpendingHealth,
  isAlarming,
  spendingHealthCaption,
} from '@/lib/budget-plan/spending-health';
import type { BudgetPlanResponse, BudgetStateContext } from '@repo/shared';

/* ────────────────────────────────────────────────────────────────────────────
   Recharts needs concrete colour values rather than Tailwind classes, so the
   @theme tokens are mirrored as hex here. Only tokens that actually exist are
   listed: `dark-green` (#5a8a1a) was deleted from the theme for failing AA and
   is banned by scripts/check-tokens.mjs, which now rejects the raw hex too.

   The split matters on this surface. `tomato`/`amber` carry *spending health*
   — over budget, and close to it — so they are never spent on categorical
   identity; a page whose job is to say "you overspent" cannot have red already
   meaning "lunch". Category colour is a single-hue ramp instead, and every
   category is directly labelled so colour is never the only encoding.
   ──────────────────────────────────────────────────────────────────────────── */
const TEAL_DEEP = '#0d6363';
const TEAL_DEEPER = '#094a4a';
const TEAL_MID = '#2e9c9c';
const SAND = '#ebe0cd';
const SAND_EDGE = '#8d8271';
const SLATE = '#5c5145';
const TOMATO_INK = '#a02c1d';
const WHITE = '#ffffff';

/** Ordered light→dark is wrong for identity; ordered dark→light reads as rank. */
const CATEGORY_RAMP = [TEAL_DEEPER, TEAL_DEEP, TEAL_MID, SAND_EDGE, SLATE];

const chartTooltipStyle = {
  backgroundColor: WHITE,
  border: `1px solid ${SAND_EDGE}`,
  borderRadius: 12,
  color: '#1f1a14',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
} as const;

const chartAxisTick = { fontSize: 11, fill: SLATE, fontFamily: 'var(--font-sans)' } as const;

/* ── Dates ──────────────────────────────────────────────────────────────── */

/**
 * Parse a `YYYY-MM-DD` slot date in the *local* zone.
 *
 * `new Date('2026-07-15')` is UTC midnight, which renders as the 14th anywhere
 * west of Greenwich. The rest of the app already forces local with a time
 * suffix; analytics is not allowed to disagree with it about which day a meal
 * happened on.
 */
const parseLocalDate = (iso: string): Date => new Date(`${iso}T00:00:00`);

const toISODate = (d: Date): string => localDateString(d);

type RangeKind = 'week' | 'month' | 'plan' | 'custom';

interface Range {
  kind: RangeKind;
  startDate: string;
  endDate: string;
  /** Set only when kind === 'plan'. */
  planId?: string;
}

function thisWeek(): Range {
  const now = new Date();
  return {
    kind: 'week',
    startDate: toISODate(startOfWeek(now, { weekStartsOn: 1 })),
    endDate: toISODate(endOfWeek(now, { weekStartsOn: 1 })),
  };
}

function thisMonth(): Range {
  const now = new Date();
  return {
    kind: 'month',
    startDate: toISODate(startOfMonth(now)),
    endDate: toISODate(endOfMonth(now)),
  };
}

const planRange = (plan: BudgetPlanResponse): Range => ({
  kind: 'plan',
  startDate: plan.startDate,
  endDate: plan.endDate,
  planId: plan.id,
});

/** "1 – 31 Jul 2026", the range spelled out so it never has to be inferred. */
function rangeLabel(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) return `${format(start, 'd')} – ${format(end, 'd MMM yyyy')}`;
  if (sameYear) return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

/**
 * A titled region.
 *
 * The title leads. It used to trail a decorative `01`–`04` code that occupied
 * the lead scan position, so reading down the page gave "01 02 03 04" instead
 * of the four things the panels actually show. The tinted header strip is gone
 * too — a filled bar inside a bordered card is a card inside a card.
 */
function Panel({
  title,
  hint,
  action,
  className = '',
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={`flex flex-col rounded-2xl border border-sand bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-sand px-5 py-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-charcoal">
            {title}
          </h2>
          {hint && <p className="text-[12px] text-slate">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

/**
 * A chart's data, repeated as a real table for assistive tech.
 *
 * Recharts emits an unlabelled `<svg>` of `<path>` elements. `role="img"` plus
 * a summarising label gives a screen reader the takeaway; this gives it the
 * numbers, which is what the sighted user gets too.
 */
function ChartData({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  // The clip lives on a wrapping div, not on the table. `sr-only` hides by
  // pinning width to 1px, which a `display: table` box treats as a minimum and
  // overrides with its shrink-to-fit content width — so an sr-only <table>
  // renders at full width and pushes the page sideways on a phone.
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Consistent placement for "nothing here yet" across every panel. */
function PanelEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[8rem] items-center justify-center px-4 py-8 text-center">
      <p className="max-w-[34ch] text-[13px] text-slate">{children}</p>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3.5 text-[12px] font-medium transition-colors sm:min-h-9 ${FOCUS_RING} ${
        active
          ? 'border-teal-deep bg-teal/10 font-semibold text-teal-deep'
          : 'border-sand bg-white text-slate hover:border-teal-deep/50'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

type BreakdownBy = 'mealType' | 'restaurant';

export default function AnalyticsPage() {
  // Null until a default is resolved: the honest default is the plan the user
  // is actually living in, which needs a round-trip to know.
  const [range, setRange] = useState<Range | null>(null);
  const [breakdownBy, setBreakdownBy] = useState<BreakdownBy>('mealType');
  const [showAllMeals, setShowAllMeals] = useState(false);

  const activePlanQuery = useActiveBudgetPlan();
  const plansQuery = useBudgetPlans({ limit: 12, offset: 0 });
  const mealTypesQuery = useListActiveMealTypes();

  const plans = useMemo(() => plansQuery.data?.data ?? [], [plansQuery.data]);
  const mealTypes = useMemo(() => mealTypesQuery.data ?? [], [mealTypesQuery.data]);

  // Restore a range from the URL once on mount, so an interrupted session (the
  // product's core scene is a phone) comes back to the period it was reading
  // rather than to the default.
  useEffect(() => {
    if (range) return;
    const params = new URLSearchParams(window.location.search);
    const kind = params.get('range') as RangeKind | null;
    const from = params.get('from');
    const to = params.get('to');
    const plan = params.get('plan');
    if (kind === 'week') return setRange(thisWeek());
    if (kind === 'month') return setRange(thisMonth());
    if (kind === 'plan' && plan && from && to) {
      return setRange({ kind: 'plan', startDate: from, endDate: to, planId: plan });
    }
    if (kind === 'custom' && from && to && from <= to) {
      return setRange({ kind: 'custom', startDate: from, endDate: to });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Otherwise open on the period the user actually budgeted in: the running
  // plan, or failing that the most recent one. The calendar month is the last
  // resort, not the default — on the 1st of a month it is an empty page, and
  // a plan almost never lines up with a calendar month anyway.
  const activePlan = activePlanQuery.data?.plan;
  const activeBudgetState = activePlanQuery.data?.budgetState;
  // `isPending` rather than `isLoading`: a query that has failed is settled,
  // not loading. Gating on `isLoading` meant that when these two requests
  // failed the range never resolved, and the page sat on skeletons forever
  // instead of reaching the error states below — a dropped request on mobile
  // data would have hung the surface with nothing to retry.
  const defaultsResolved = !activePlanQuery.isPending && !plansQuery.isPending;
  useEffect(() => {
    if (range || !defaultsResolved) return;
    const fallback = activePlan ?? plans[0];
    setRange(fallback ? planRange(fallback) : thisMonth());
  }, [range, defaultsResolved, activePlan, plans]);

  useEffect(() => {
    if (!range) return;
    const params = new URLSearchParams();
    params.set('range', range.kind);
    params.set('from', range.startDate);
    params.set('to', range.endDate);
    if (range.planId) params.set('plan', range.planId);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [range]);

  const query = range
    ? { startDate: range.startDate, endDate: range.endDate, budgetPlanId: range.planId }
    : { startDate: '', endDate: '' };

  const spendingQuery = useSpendingAnalytics(query);
  const historyQuery = useMealHistory(query);

  const spending = spendingQuery.data;
  const history = useMemo(() => historyQuery.data?.data ?? [], [historyQuery.data]);

  /** The plan backing the current range, when there is one. */
  const selectedPlan = useMemo(
    () =>
      range?.planId
        ? (plans.find((p) => p.id === range.planId) ??
          (activePlan?.id === range.planId ? activePlan : undefined))
        : undefined,
    [range?.planId, plans, activePlan],
  );

  const mealTypesById = useMemo(() => new Map(mealTypes.map((mt) => [mt.id, mt])), [mealTypes]);

  /* ── Panel 1: daily spend against the daily allowance ─────────────────── */

  /** Budget spread evenly over the plan's days — the line a day is "over". */
  const dailyAllowance = useMemo(() => {
    if (!selectedPlan || !range) return null;
    const days = eachDayOfInterval({
      start: parseLocalDate(range.startDate),
      end: parseLocalDate(range.endDate),
    }).length;
    return days > 0 ? selectedPlan.totalBudget / days : null;
  }, [selectedPlan, range]);

  const dailySeries = useMemo(() => {
    if (!range || !spending) return [];
    const byDate = new Map(spending.daily.map((p) => [p.date, p.amount]));
    const today = localDateString();
    return (
      eachDayOfInterval({
        start: parseLocalDate(range.startDate),
        end: parseLocalDate(range.endDate),
      })
        // Future days of an in-progress plan are not zero-spend days; drawing
        // them as empty bars reads as a spending collapse that never happened.
        .filter((d) => toISODate(d) <= today)
        .map((d) => {
          const iso = toISODate(d);
          return { iso, label: format(d, 'MMM d'), amount: byDate.get(iso) ?? 0 };
        })
    );
  }, [range, spending]);

  /* ── Panel 2: burn-down ───────────────────────────────────────────────── */

  const burndown = useMemo(() => {
    if (!range || !spending) return [];
    const byDate = new Map(spending.daily.map((p) => [p.date, p.amount]));
    const today = localDateString();
    const days = eachDayOfInterval({
      start: parseLocalDate(range.startDate),
      end: parseLocalDate(range.endDate),
    });
    const total = selectedPlan?.totalBudget ?? null;
    let running = 0;
    return days.map((d, i) => {
      const iso = toISODate(d);
      const isPast = iso <= today;
      if (isPast) running += byDate.get(iso) ?? 0;
      return {
        label: format(d, 'MMM d'),
        actual: isPast ? running : null,
        ideal: total !== null ? (total * (i + 1)) / days.length : null,
      };
    });
  }, [range, spending, selectedPlan]);

  /* ── Panel 3: where it went ───────────────────────────────────────────── */

  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of history) {
      const key =
        breakdownBy === 'mealType'
          ? (mealTypesById.get(item.mealTypeId)?.label ?? 'Other')
          : item.isHomeCooked
            ? 'Cooked at home'
            : item.restaurantName
              ? humanizeName(item.restaurantName)
              : 'Logged by hand';
      totals.set(key, (totals.get(key) ?? 0) + item.actualAmountSpent);
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((s, i) => ({ ...s, fill: CATEGORY_RAMP[i % CATEGORY_RAMP.length] ?? TEAL_DEEP }));
  }, [history, breakdownBy, mealTypesById]);

  /* ── Panel 5: adherence across plans ──────────────────────────────────── */

  const adherence = useMemo(
    () =>
      plans
        // A cancelled plan was abandoned, not overspent; charting it as a short
        // bar next to real outcomes reads as thrift that never happened.
        .filter((p) => p.status !== 'cancelled')
        .slice()
        .reverse()
        .map((p) => ({
          label: planTitle(p),
          budget: p.totalBudget,
          actual: p.spentAmount,
          inProgress: p.status === 'active',
          over: p.spentAmount > p.totalBudget,
        })),
    [plans],
  );

  const hasInProgress = adherence.some((p) => p.inProgress);

  /* ── Verdict ──────────────────────────────────────────────────────────── */

  const totalSpent = spending?.totalSpent ?? 0;
  const mealCount = spending?.mealCount ?? 0;
  const averageMeal = mealCount > 0 ? totalSpent / mealCount : 0;

  const setCustom = (patch: Partial<Pick<Range, 'startDate' | 'endDate'>>) => {
    if (!range) return;
    const next = { ...range, kind: 'custom' as const, planId: undefined, ...patch };
    // Keep the pair ordered rather than letting an inverted range reach the
    // API, where it can only come back as a misleading "no spending".
    if (next.startDate > next.endDate) {
      if (patch.startDate) next.endDate = next.startDate;
      else next.startDate = next.endDate;
    }
    setRange(next);
  };

  // Only while working out which period to open on. The real heading stays put
  // rather than being replaced by a blank block, so the page never looks like
  // it failed to load.
  if (!range) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-deep">
            Spend · Analytics
          </div>
          <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
            Every rupee, accounted for.
          </h1>
          <p className="sr-only" role="status">
            Loading your spending.
          </p>
        </header>
        <div className="h-28 animate-pulse rounded-2xl border border-sand bg-white" />
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <ChartSkeleton variant="bar" />
          <ChartSkeleton variant="line" />
        </div>
      </div>
    );
  }

  const label = rangeLabel(range.startDate, range.endDate);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-deep">
              Spend · Analytics
            </div>
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
              Every rupee, accounted for.
            </h1>
            <p className="max-w-[60ch] text-[14px] text-slate">
              What you spent against what you budgeted, day by day — and where it went.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div
              role="group"
              aria-label="Choose the period to analyse"
              className="flex flex-wrap items-center gap-2"
            >
              <ToggleButton active={range.kind === 'week'} onClick={() => setRange(thisWeek())}>
                This week
              </ToggleButton>
              <ToggleButton active={range.kind === 'month'} onClick={() => setRange(thisMonth())}>
                This month
              </ToggleButton>
              <ToggleButton
                active={range.kind === 'custom'}
                onClick={() => setRange({ ...range, kind: 'custom', planId: undefined })}
              >
                Custom dates
              </ToggleButton>

              {plans.length > 0 && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="analytics-plan"
                    className="text-[12px] font-medium text-slate sm:sr-only"
                  >
                    Budget plan
                  </label>
                  <select
                    id="analytics-plan"
                    value={range.planId ?? ''}
                    onChange={(e) => {
                      const plan = plans.find((p) => p.id === e.target.value);
                      if (plan) setRange(planRange(plan));
                    }}
                    className={`min-h-11 rounded-full border bg-white px-3.5 text-[12px] font-medium text-slate transition-colors sm:min-h-9 ${FOCUS_RING_ON_CANVAS} ${
                      range.kind === 'plan'
                        ? 'border-teal-deep font-semibold text-teal-deep'
                        : 'border-sand hover:border-teal-deep/50'
                    }`}
                  >
                    <option value="">By budget plan…</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {planTitle(p)}
                        {p.status === 'active' ? ' (current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {range.kind === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sand bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="range-start" className="text-[12px] font-medium text-slate">
                    From
                  </label>
                  <input
                    id="range-start"
                    type="date"
                    value={range.startDate}
                    max={range.endDate}
                    onChange={(e) => setCustom({ startDate: e.target.value })}
                    className={`min-h-11 rounded-lg border border-sand-edge bg-white px-2.5 text-[13px] text-charcoal sm:min-h-9 ${FOCUS_RING}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="range-end" className="text-[12px] font-medium text-slate">
                    To
                  </label>
                  <input
                    id="range-end"
                    type="date"
                    value={range.endDate}
                    min={range.startDate}
                    onChange={(e) => setCustom({ endDate: e.target.value })}
                    className={`min-h-11 rounded-lg border border-sand-edge bg-white px-2.5 text-[13px] text-charcoal sm:min-h-9 ${FOCUS_RING}`}
                  />
                </div>
              </div>
            )}
          </div>
        </header>
      </FadeUp>

      {/* The answer, before any chart. */}
      <FadeUp delay={0.05}>
        <Verdict
          label={label}
          loading={spendingQuery.isLoading}
          error={!!spendingQuery.error}
          onRetry={() => spendingQuery.refetch()}
          totalSpent={totalSpent}
          mealCount={mealCount}
          averageMeal={averageMeal}
          plan={selectedPlan}
          budgetState={
            selectedPlan && selectedPlan.id === activePlan?.id ? activeBudgetState : undefined
          }
          onPickActivePlan={activePlan ? () => setRange(planRange(activePlan)) : undefined}
        />
      </FadeUp>

      {/* `items-start` so a panel is only as tall as its content. Stretching
          left the breakdown chart floating in ~400px of dead space whenever
          the meal table beside it ran long. */}
      <Stagger
        className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5"
        delay={0.1}
        stagger={0.08}
      >
        {/* ── Daily spend vs allowance ───────────────────────────────────── */}
        <StaggerItem>
          <Panel
            title="Day by day"
            hint={
              dailyAllowance !== null
                ? `Your daily allowance is ${formatPKR(dailyAllowance)}. Bars above it are over.`
                : 'Pick a budget plan to see your daily allowance on this chart.'
            }
          >
            {/* A failure message does not need a chart's worth of height. */}
            <div className={spendingQuery.error ? '' : 'h-64'}>
              {spendingQuery.isLoading ? (
                <ChartSkeleton variant="bar" />
              ) : spendingQuery.error ? (
                <DataError
                  message="We couldn't load your spending just now."
                  onRetry={() => spendingQuery.refetch()}
                />
              ) : dailySeries.length === 0 ? (
                <PanelEmpty>No meals logged in {label} yet.</PanelEmpty>
              ) : (
                <>
                  <div
                    role="img"
                    aria-label={`Daily spending for ${label}. Total ${formatPKR(totalSpent)} across ${mealCount} meals.${
                      dailyAllowance !== null
                        ? ` Daily allowance ${formatPKR(dailyAllowance)}; ${dailySeries.filter((d) => d.amount > dailyAllowance).length} of ${dailySeries.length} days went over it.`
                        : ''
                    }`}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailySeries}
                        margin={{
                          top: 8,
                          right: dailyAllowance !== null ? 58 : 12,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={SAND} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={chartAxisTick}
                          interval="preserveStartEnd"
                          minTickGap={16}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={chartAxisTick}
                          tickFormatter={formatPKRCompact}
                          width={44}
                          label={{
                            value: '₨',
                            position: 'insideTopLeft',
                            fontSize: 11,
                            fill: SLATE,
                          }}
                        />
                        <Tooltip
                          cursor={{ fill: SAND, opacity: 0.25 }}
                          contentStyle={chartTooltipStyle}
                          formatter={(value: number) => [formatPKR(value), 'Spent']}
                        />
                        {dailyAllowance !== null && (
                          <ReferenceLine
                            y={dailyAllowance}
                            stroke={SLATE}
                            strokeWidth={1.5}
                            strokeDasharray="5 4"
                            // Outside the plot area: an inside label sat on top
                            // of whichever bar happened to be tallest that week.
                            label={{
                              value: 'Allowance',
                              position: 'right',
                              fontSize: 10,
                              fill: SLATE,
                            }}
                          />
                        )}
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={28}>
                          {dailySeries.map((d) => (
                            <Cell
                              key={d.iso}
                              // Colour here is redundant with position against
                              // the allowance line, never the only signal.
                              fill={
                                dailyAllowance !== null && d.amount > dailyAllowance
                                  ? TOMATO_INK
                                  : TEAL_DEEP
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartData
                    caption={`Daily spending for ${label}`}
                    columns={['Day', 'Spent']}
                    rows={dailySeries.map((d) => [d.label, formatPKR(d.amount)])}
                  />
                </>
              )}
            </div>
          </Panel>
        </StaggerItem>

        {/* ── Burn-down ──────────────────────────────────────────────────── */}
        <StaggerItem>
          <Panel
            title={selectedPlan ? 'Budget burn-down' : 'Cumulative spend'}
            hint={
              selectedPlan
                ? 'Your running total against an even spend of the budget. The gap is your drift.'
                : 'Your running total for this range.'
            }
          >
            <div className={spendingQuery.error ? '' : 'h-64'}>
              {spendingQuery.isLoading ? (
                <ChartSkeleton variant="line" />
              ) : spendingQuery.error ? (
                <DataError
                  message="We couldn't load your spending just now."
                  onRetry={() => spendingQuery.refetch()}
                />
              ) : burndown.length === 0 ? (
                <PanelEmpty>No meals logged in {label} yet.</PanelEmpty>
              ) : (
                <>
                  <div
                    role="img"
                    aria-label={
                      selectedPlan
                        ? `Cumulative spending against budget for ${label}. Spent ${formatPKR(totalSpent)} of ${formatPKR(selectedPlan.totalBudget)}.`
                        : `Cumulative spending for ${label}, totalling ${formatPKR(totalSpent)}.`
                    }
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={burndown} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={SAND} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={chartAxisTick}
                          interval="preserveStartEnd"
                          minTickGap={16}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={chartAxisTick}
                          tickFormatter={formatPKRCompact}
                          width={44}
                          label={{
                            value: '₨',
                            position: 'insideTopLeft',
                            fontSize: 11,
                            fill: SLATE,
                          }}
                        />
                        <Tooltip
                          cursor={{ stroke: SAND_EDGE, strokeDasharray: '3 3' }}
                          contentStyle={chartTooltipStyle}
                          formatter={(value: number, name: string) => [
                            formatPKR(value),
                            name === 'ideal' ? 'Even pace' : 'Spent so far',
                          ]}
                        />
                        {selectedPlan && (
                          <Line
                            type="linear"
                            dataKey="ideal"
                            stroke={SLATE}
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                            name="ideal"
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke={TEAL_DEEP}
                          strokeWidth={2.5}
                          dot={false}
                          connectNulls={false}
                          activeDot={{ r: 5, fill: TEAL_DEEP, strokeWidth: 0 }}
                          name="actual"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="sr-only">
                    {selectedPlan
                      ? 'The dashed line is an even spend of the budget across the period; the solid line is what you actually spent.'
                      : 'The solid line is your running total.'}
                  </p>
                  <ChartData
                    caption={`Cumulative spending for ${label}`}
                    columns={
                      selectedPlan ? ['Day', 'Spent so far', 'Even pace'] : ['Day', 'Spent so far']
                    }
                    rows={burndown
                      .filter((d) => d.actual !== null)
                      .map((d) =>
                        selectedPlan
                          ? [d.label, formatPKR(d.actual ?? 0), formatPKR(d.ideal ?? 0)]
                          : [d.label, formatPKR(d.actual ?? 0)],
                      )}
                  />
                </>
              )}
            </div>
          </Panel>
        </StaggerItem>

        {/* ── Where it went ──────────────────────────────────────────────── */}
        {/* Full width: horizontal bars want the run, and grouping by restaurant
            produces names that a half-column truncates. */}
        <StaggerItem className="lg:col-span-2">
          <Panel
            title="Where it went"
            hint={breakdownBy === 'mealType' ? 'Grouped by meal type.' : 'Grouped by restaurant.'}
            action={
              <div role="group" aria-label="Group spending by" className="flex gap-1.5">
                <ToggleButton
                  active={breakdownBy === 'mealType'}
                  onClick={() => setBreakdownBy('mealType')}
                >
                  Meal type
                </ToggleButton>
                <ToggleButton
                  active={breakdownBy === 'restaurant'}
                  onClick={() => setBreakdownBy('restaurant')}
                >
                  Restaurant
                </ToggleButton>
              </div>
            }
          >
            {/* Height follows the number of groups: three meal types in a
                fixed 16rem box left the bars stranded at the top of it. */}
            <div
              style={{
                height: historyQuery.error
                  ? undefined
                  : breakdown.length > 0
                    ? `${Math.max(11, breakdown.length * 3 + 3)}rem`
                    : '11rem',
              }}
            >
              {historyQuery.isLoading ||
              (breakdownBy === 'mealType' && mealTypesQuery.isLoading) ? (
                <ChartSkeleton variant="bar" />
              ) : historyQuery.error ? (
                <DataError
                  message="We couldn't load your meals just now."
                  onRetry={() => historyQuery.refetch()}
                />
              ) : breakdownBy === 'mealType' && mealTypesQuery.error ? (
                <DataError
                  message="We couldn't load your meal types, so this can't be grouped by them."
                  onRetry={() => mealTypesQuery.refetch()}
                />
              ) : breakdown.length === 0 ? (
                <PanelEmpty>No meals logged in {label} yet.</PanelEmpty>
              ) : (
                <>
                  <div
                    role="img"
                    aria-label={`Spending by ${breakdownBy === 'mealType' ? 'meal type' : 'restaurant'} for ${label}. ${breakdown
                      .map((b) => `${b.name} ${formatPKR(b.value)}`)
                      .join(', ')}.`}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={breakdown}
                        layout="vertical"
                        margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={SAND} />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={chartAxisTick}
                          tickFormatter={formatPKRCompact}
                        />
                        {/* The category name is rendered as an axis label, so
                            identity never depends on telling two fills apart. */}
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ ...chartAxisTick, fontSize: 12 }}
                          width={140}
                        />
                        <Tooltip
                          cursor={{ fill: SAND, opacity: 0.25 }}
                          contentStyle={chartTooltipStyle}
                          formatter={(value: number) => [formatPKR(value), 'Spent']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                          {breakdown.map((b) => (
                            <Cell key={b.name} fill={b.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartData
                    caption={`Spending by ${breakdownBy === 'mealType' ? 'meal type' : 'restaurant'} for ${label}`}
                    columns={['Group', 'Spent']}
                    rows={breakdown.map((b) => [b.name, formatPKR(b.value)])}
                  />
                </>
              )}
            </div>
          </Panel>
        </StaggerItem>

        {/* ── Meal history ───────────────────────────────────────────────── */}
        <StaggerItem className="lg:col-span-2">
          <Panel
            title="Every meal"
            hint={mealCount > 0 ? `${mealCount} logged in ${label}.` : undefined}
          >
            {historyQuery.isLoading ? (
              <TableSkeleton rows={5} columns={3} />
            ) : historyQuery.error ? (
              <DataError
                message="We couldn't load your meals just now."
                onRetry={() => historyQuery.refetch()}
              />
            ) : history.length === 0 ? (
              <PanelEmpty>
                No meals logged in {label} yet. Log what you spend and it shows up here.
              </PanelEmpty>
            ) : (
              <MealHistoryTable
                caption={`Meals logged in ${label}`}
                items={showAllMeals ? history : history.slice(0, 8)}
                mealTypesById={mealTypesById}
                total={totalSpent}
                hiddenCount={showAllMeals ? 0 : Math.max(0, history.length - 8)}
                onShowAll={() => setShowAllMeals(true)}
              />
            )}
          </Panel>
        </StaggerItem>
      </Stagger>

      {/* ── Adherence across plans. Deliberately outside the range-governed
          grid: it spans every plan, so the period controls above do not and
          should not appear to govern it. ─────────────────────────────────── */}
      <FadeUp delay={0.15}>
        <Panel
          title="Every plan so far"
          hint={
            hasInProgress
              ? 'Across all your budget plans. The current plan is still running, so its bar is partial.'
              : 'Across all your budget plans, whatever period is selected above.'
          }
        >
          <div className={plansQuery.error ? '' : 'h-64'}>
            {plansQuery.isLoading ? (
              <ChartSkeleton variant="bar" />
            ) : plansQuery.error ? (
              <DataError
                message="We couldn't load your budget plans just now."
                onRetry={() => plansQuery.refetch()}
              />
            ) : adherence.length === 0 ? (
              <PanelEmpty>
                No budget plans yet. Once you finish a plan, its budget and what you actually spent
                show up here side by side.
              </PanelEmpty>
            ) : (
              <>
                <div
                  role="img"
                  aria-label={`Budget against actual spend for ${adherence.length} plans. ${adherence
                    .map(
                      (p) =>
                        `${p.label}: budget ${formatPKR(p.budget)}, spent ${formatPKR(p.actual)}${p.inProgress ? ' so far' : ''}`,
                    )
                    .join('. ')}.`}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={adherence}
                      barCategoryGap="28%"
                      barGap={4}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={SAND} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={chartAxisTick}
                        interval={0}
                        minTickGap={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={chartAxisTick}
                        tickFormatter={formatPKRCompact}
                        width={44}
                        label={{
                          value: '₨',
                          position: 'insideTopLeft',
                          fontSize: 11,
                          fill: SLATE,
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: SAND, opacity: 0.25 }}
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number, name: string) => [
                          formatPKR(value),
                          name === 'budget' ? 'Budget' : 'Actually spent',
                        ]}
                      />
                      {/* `sand-edge` rather than `sand`: the budget is the
                          reference every other mark is judged against, and at
                          1.32:1 it was the least visible thing on the page. */}
                      <Bar
                        dataKey="budget"
                        fill={SAND_EDGE}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                        name="budget"
                      />
                      <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={32} name="actual">
                        {adherence.map((p) => (
                          <Cell key={p.label} fill={p.over ? TOMATO_INK : TEAL_DEEP} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartData
                  caption="Budget against actual spend, per plan"
                  columns={['Plan', 'Budget', 'Actually spent', 'Status']}
                  rows={adherence.map((p) => [
                    p.label,
                    formatPKR(p.budget),
                    formatPKR(p.actual),
                    p.inProgress ? 'Still running' : p.over ? 'Over budget' : 'Within budget',
                  ])}
                />
                <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate">
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: SAND_EDGE }}
                    />
                    Budget
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: TEAL_DEEP }}
                    />
                    Spent, within budget
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: TOMATO_INK }}
                    />
                    Spent, over budget
                  </li>
                </ul>
              </>
            )}
          </div>
        </Panel>
      </FadeUp>
    </div>
  );
}

/* ── Verdict ────────────────────────────────────────────────────────────── */

/**
 * The answer the page exists to give, before any chart.
 *
 * `totalSpent` and `mealCount` were already in every response and never
 * rendered, so "how much did I spend?" could only be answered by eyeballing a
 * line or summing a table. It is a sentence rather than a row of stat tiles:
 * the figure a user needs is inseparable from whether it was too much, and
 * `spendingHealthCaption` already says that in the product's own words.
 */
function Verdict({
  label,
  loading,
  error,
  onRetry,
  totalSpent,
  mealCount,
  averageMeal,
  plan,
  budgetState,
  onPickActivePlan,
}: {
  label: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  totalSpent: number;
  mealCount: number;
  averageMeal: number;
  plan?: BudgetPlanResponse;
  /** The live, pin-adjusted state, present only for the active plan. */
  budgetState?: BudgetStateContext;
  onPickActivePlan?: () => void;
}) {
  if (error) {
    return <DataError message="We couldn't load your spending just now." onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-canvas" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-canvas" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-canvas" />
      </div>
    );
  }

  // Budget figures come from the plan, not from the range total, and from the
  // pin-adjusted `budgetState` wherever it exists — that is what the sidebar
  // and header read, and two budget numbers six inches apart must not disagree.
  const budget = plan
    ? {
        spent: budgetState?.amountSpent ?? plan.spentAmount,
        total: budgetState?.totalBudget ?? plan.totalBudget,
        remaining: budgetState?.amountRemaining ?? plan.remainingAmount,
      }
    : null;
  const health = budget ? getSpendingHealth(budget) : null;
  const alarming = health ? isAlarming(health) : false;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-6 ${
        alarming ? 'border-tomato/30 bg-tomato/[0.06]' : 'border-sand bg-white'
      }`}
    >
      <p className="text-[12px] font-semibold uppercase tracking-widest text-slate">{label}</p>

      {budget ? (
        <>
          <p className="font-display text-[clamp(20px,2.4vw,28px)] font-semibold leading-snug tracking-tight text-charcoal">
            You&rsquo;ve spent{' '}
            <span className={alarming ? 'text-tomato-ink' : 'text-teal-deep'}>
              {formatPKR(budget.spent)}
            </span>{' '}
            of {formatPKR(budget.total)} —{' '}
            <span className={alarming ? 'text-tomato-ink' : 'text-teal-deep'}>
              {formatPKR(Math.abs(budget.remaining))} {budget.remaining < 0 ? 'over' : 'left'}
            </span>
            .
          </p>
          <p className={`text-[14px] ${alarming ? 'text-tomato-ink' : 'text-slate'}`}>
            {health && spendingHealthCaption(health, budget.remaining)}
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-[clamp(20px,2.4vw,28px)] font-semibold leading-snug tracking-tight text-charcoal">
            You&rsquo;ve spent <span className="text-teal-deep">{formatPKR(totalSpent)}</span>{' '}
            across {mealCount} {mealCount === 1 ? 'meal' : 'meals'}.
          </p>
          <p className="text-[14px] text-slate">
            These dates aren&rsquo;t a budget plan, so there&rsquo;s no budget to measure them
            against.{' '}
            {onPickActivePlan && (
              <button
                type="button"
                onClick={onPickActivePlan}
                className={`rounded font-semibold text-teal-deep underline underline-offset-2 hover:text-teal-deeper ${FOCUS_RING}`}
              >
                Show my current plan instead
              </button>
            )}
          </p>
        </>
      )}

      {mealCount > 0 && (
        <p className="text-[13px] text-slate">
          {mealCount} {mealCount === 1 ? 'meal' : 'meals'} logged · {formatPKR(averageMeal)} a meal
          on average
        </p>
      )}
    </div>
  );
}

/* ── Meal history ───────────────────────────────────────────────────────── */

function MealHistoryTable({
  caption,
  items,
  mealTypesById,
  total,
  hiddenCount,
  onShowAll,
}: {
  caption: string;
  items: {
    id: string;
    slotDate: string;
    mealTypeId: string;
    actualAmountSpent: number;
    restaurantName: string | null;
    manualDescription: string | null;
    isHomeCooked: boolean;
  }[];
  mealTypesById: Map<string, { label: string }>;
  total: number;
  hiddenCount: number;
  onShowAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* A real table, not a grid of divs: the amounts need to be announced as
          cells of an "Amount" column, and the fake header announced as three
          loose strings. Horizontal scroll is contained here so the page body
          never scrolls sideways on a phone. */}
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[20rem] border-collapse text-left">
          {/* Hidden on the span, not the caption: a table-caption box sizes to
              its content the same way a table does. */}
          <caption>
            <span className="sr-only">{caption}</span>
          </caption>
          <thead>
            <tr className="border-b border-sand">
              <th
                scope="col"
                className="pb-2 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate"
              >
                Date
              </th>
              <th
                scope="col"
                className="pb-2 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate"
              >
                Meal
              </th>
              <th
                scope="col"
                className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const type = mealTypesById.get(item.mealTypeId)?.label ?? 'Meal';
              const where = item.isHomeCooked
                ? '🍳 Cooked at home'
                : item.restaurantName
                  ? humanizeName(item.restaurantName)
                  : (item.manualDescription ?? 'Logged by hand');
              return (
                <tr key={item.id} className="border-b border-sand/70 last:border-0">
                  <td className="whitespace-nowrap py-3 pr-3 align-top text-[12px] text-slate">
                    {format(new Date(`${item.slotDate}T00:00:00`), 'MMM d')}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate">
                      {type}
                    </span>
                    <span className="block text-[13px] font-medium text-charcoal">{where}</span>
                  </td>
                  <td className="whitespace-nowrap py-3 text-right align-top font-display text-[14px] font-semibold tabular-nums text-charcoal">
                    {formatPKR(item.actualAmountSpent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-sand">
              <th scope="row" colSpan={2} className="pt-3 text-[12px] font-semibold text-slate">
                Total for this period
              </th>
              <td className="pt-3 text-right font-display text-[15px] font-semibold tabular-nums text-charcoal">
                {formatPKR(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className={`min-h-11 self-start rounded-full border border-sand bg-white px-4 text-[12px] font-semibold text-teal-deep transition-colors hover:border-teal-deep/50 sm:min-h-9 ${FOCUS_RING}`}
        >
          Show {hiddenCount} more {hiddenCount === 1 ? 'meal' : 'meals'}
        </button>
      )}
    </div>
  );
}
