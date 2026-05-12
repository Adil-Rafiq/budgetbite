'use client';

import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartSkeleton, TableSkeleton } from '@/components/skeletons';
import { FadeUp, Stagger, StaggerItem, Pill } from '@/components/motion';
import { motion } from 'motion/react';

import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { useMealHistory, useSpendingAnalytics } from '@/hooks/use-analytics';

// ─── Wispr palette ───────────────────────────────────────────────────────────

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const GLOW = '#ffa946';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

// Ordered tint pool for meal-type slices/dots. Both the pie chart and the
// history-table row dots index into this by meal-type position, so they stay
// in sync regardless of which meal types the user has configured.
const mealTypePalette = [FATHOM, AMBER, PULSE, VAST, GLOW, SOFT, MUTED];

const chartTooltipStyle = {
  backgroundColor: WHITE,
  border: `1px solid ${LUMEN_DK}`,
  borderRadius: 12,
  color: VAST,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
} as const;

const chartAxisTick = { fontSize: 11, fill: MUTED, fontFamily: 'var(--font-mono)' } as const;

// ─── Types + helpers ─────────────────────────────────────────────────────────

type RangeKind = 'week' | 'month' | 'custom';

interface Range {
  kind: RangeKind;
  startDate: string;
  endDate: string;
}

const toISODate = (d: Date): string => format(d, 'yyyy-MM-dd');

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

const formatPKR = (value: number) => `₨ ${value.toLocaleString()}`;
const formatPKRCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}k`;
  return String(value);
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Panel({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3.5"
        style={{ borderColor: LUMEN_DK, background: LUMEN }}
      >
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.22em' }}
        >
          {code}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 600,
            color: VAST,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pill
      variant="filter"
      active={active}
      onClick={onClick}
      style={{ padding: '6px 16px', fontSize: 12 }}
    >
      {children}
    </Pill>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>(thisMonth());

  const spendingQuery = useSpendingAnalytics({
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const historyQuery = useMealHistory({
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const plansQuery = useBudgetPlans({ limit: 12, offset: 0 });
  const { data: mealTypes = [] } = useListActiveMealTypes();

  const spending = spendingQuery.data;
  const historyData = historyQuery.data?.data;
  const plansData = plansQuery.data?.data;

  const spendingChartData = useMemo(
    () =>
      (spending?.daily ?? []).map((p) => ({
        date: format(new Date(p.date), 'MMM d'),
        amount: p.amount,
      })),
    [spending?.daily],
  );

  const budgetVsActual = useMemo(
    () =>
      (plansData ?? [])
        .slice()
        .reverse()
        .map((p) => ({
          label: format(new Date(p.startDate), 'MMM yyyy'),
          budget: p.totalBudget,
          actual: p.spentAmount,
        })),
    [plansData],
  );

  const mealTypesById = useMemo(() => new Map(mealTypes.map((mt) => [mt.id, mt])), [mealTypes]);

  // Stable color for each meal type based on its position in the user's
  // configured list. Drives both the pie chart and the history table dot.
  const colorByMealTypeId = useMemo(() => {
    const map = new Map<string, string>();
    mealTypes.forEach((mt, i) => {
      map.set(mt.id, mealTypePalette[i % mealTypePalette.length] ?? FATHOM);
    });
    return map;
  }, [mealTypes]);

  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of historyData ?? []) {
      const prev = totals.get(item.mealTypeId) ?? 0;
      totals.set(item.mealTypeId, prev + item.actualAmountSpent);
    }
    return Array.from(totals.entries())
      .map(([id, value]) => {
        const mt = mealTypesById.get(id);
        return {
          name: mt?.label ?? 'Other',
          value,
          fill: colorByMealTypeId.get(id) ?? FATHOM,
        };
      })
      .filter((slice) => slice.value > 0);
  }, [historyData, mealTypesById, colorByMealTypeId]);

  const history = historyData ?? [];

  const setCustomStart = (v: string) => setRange({ ...range, kind: 'custom', startDate: v });
  const setCustomEnd = (v: string) => setRange({ ...range, kind: 'custom', endDate: v });

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            spend · /analytics
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: VAST,
            }}
          >
            Understand the week.
          </h1>
          <p className="text-[14px]" style={{ color: MUTED, maxWidth: 540 }}>
            Patterns in spend, meal mix, and budget drift — over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RangeButton active={range.kind === 'week'} onClick={() => setRange(thisWeek())}>
            Week
          </RangeButton>
          <RangeButton active={range.kind === 'month'} onClick={() => setRange(thisMonth())}>
            Month
          </RangeButton>
          {range.kind === 'custom' ? (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-1"
              style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
            >
              <input
                type="date"
                value={range.startDate}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-32 bg-transparent text-[12px] outline-none"
                style={{ fontFamily: 'var(--font-mono)', color: VAST }}
              />
              <span className="text-[11px]" style={{ color: SOFT, fontFamily: 'var(--font-mono)' }}>
                →
              </span>
              <input
                type="date"
                value={range.endDate}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-32 bg-transparent text-[12px] outline-none"
                style={{ fontFamily: 'var(--font-mono)', color: VAST }}
              />
            </div>
          ) : (
            <RangeButton
              active={false}
              onClick={() =>
                setRange({
                  kind: 'custom',
                  startDate: range.startDate,
                  endDate: range.endDate,
                })
              }
            >
              Custom
            </RangeButton>
          )}
        </div>
      </header>
      </FadeUp>

      <Stagger className="grid gap-4 lg:grid-cols-2 lg:gap-5" delay={0.1} stagger={0.08}>
        {/* Spending over time */}
        <StaggerItem>
        <Panel code="01" title="Spending over time">
          <div className="h-64">
            {spendingQuery.isLoading ? (
              <ChartSkeleton variant="line" />
            ) : spendingQuery.error ? (
              <p className="text-[13px]" style={{ color: PULSE }}>
                Could not load spending.
              </p>
            ) : spendingChartData.length === 0 ? (
              <p className="text-[13px]" style={{ color: MUTED }}>
                No spending in this range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={spendingChartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={LUMEN_DK} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={chartAxisTick} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={chartAxisTick}
                    tickFormatter={formatPKRCompact}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: LUMEN_DK, strokeDasharray: '3 3' }}
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number) => [formatPKR(value), 'Spent']}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={FATHOM}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: FATHOM, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        </StaggerItem>

        {/* Budget vs actual */}
        <StaggerItem>
        <Panel code="02" title="Budget vs actual">
          <div className="h-64">
            {plansQuery.isLoading ? (
              <ChartSkeleton variant="bar" />
            ) : budgetVsActual.length === 0 ? (
              <p className="text-[13px]" style={{ color: MUTED }}>
                No budget plans yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetVsActual}
                  barCategoryGap="28%"
                  barGap={4}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={LUMEN_DK} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={chartAxisTick} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={chartAxisTick}
                    tickFormatter={formatPKRCompact}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: LUMEN, opacity: 0.6 }}
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number) => [formatPKR(value)]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingTop: 12,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: MUTED,
                    }}
                  />
                  <Bar
                    dataKey="budget"
                    fill={SOFT}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    name="Budget"
                  />
                  <Bar
                    dataKey="actual"
                    fill={FATHOM}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    name="Actual"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        </StaggerItem>

        {/* Meal type breakdown */}
        <StaggerItem>
        <Panel code="03" title="Breakdown by meal type">
          <div className="flex h-64 items-center justify-center">
            {historyQuery.isLoading ? (
              <ChartSkeleton variant="pie" />
            ) : breakdown.length === 0 ? (
              <p className="text-[13px]" style={{ color: MUTED }}>
                No meals in this range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    strokeWidth={2}
                    stroke={WHITE}
                  >
                    {breakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number) => [formatPKR(value)]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingTop: 12,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: MUTED,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        </StaggerItem>

        {/* History */}
        <StaggerItem>
        <Panel code="04" title="Meal history">
          <div className="overflow-auto">
            {historyQuery.isLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : history.length === 0 ? (
              <p className="text-[13px]" style={{ color: MUTED }}>
                No meals logged in this range.
              </p>
            ) : (
              <div className="flex flex-col">
                <div
                  className="grid grid-cols-[64px_1fr_auto] gap-3 border-b py-2 text-[10px] uppercase"
                  style={{
                    borderColor: LUMEN_DK,
                    fontFamily: 'var(--font-mono)',
                    color: SOFT,
                    letterSpacing: '0.18em',
                  }}
                >
                  <span>Date</span>
                  <span>Meal · place</span>
                  <span className="text-right">Amount</span>
                </div>
                {history.map((item, i) => {
                  const mt = mealTypesById.get(item.mealTypeId);
                  const label = mt?.label ?? 'Meal';
                  const tint = colorByMealTypeId.get(item.mealTypeId) ?? FATHOM;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(i * 0.03, 0.4),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ background: 'rgba(255,255,235,0.6)' }}
                      className="grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3"
                      style={{
                        borderTop: i === 0 ? 'none' : `1px solid ${LUMEN_DK}`,
                      }}
                    >
                      <span
                        className="text-[12px]"
                        style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                      >
                        {format(new Date(item.slotDate), 'MMM d')}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-1.5 w-1.5 rounded-full"
                            style={{ background: tint }}
                          />
                          <span
                            className="text-[10px] uppercase"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: SOFT,
                              letterSpacing: '0.18em',
                            }}
                          >
                            {label}
                          </span>
                        </div>
                        <span
                          className="truncate text-[13px]"
                          style={{ color: VAST, fontWeight: 500 }}
                        >
                          {item.restaurantName ?? item.manualDescription ?? '—'}
                        </span>
                      </div>
                      <span
                        className="text-right text-[14px] tabular-nums"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          color: VAST,
                        }}
                      >
                        ₨ {item.actualAmountSpent.toLocaleString()}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
